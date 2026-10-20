#!/usr/bin/env bash
# StudyStack: deploy a branch in one command, then check that it works.
#
# Run from any folder, as your normal user (not with sudo; it asks for the sudo
# password itself, for the docker commands):
#   ops/deploy.sh <branch>     e.g. ops/deploy.sh card-tray   (test environments only)
#   ops/deploy.sh              deploys main
#
# It works on the stack its own repo folder belongs to:
#   - the VM:         ~/StudyStack (docker-compose.prod.yml, project studystack-prod)
#   - an environment: ~/applications/environments/<test|production>/studystack-<env>,
#                     whose .env sets COMPOSE_FILE and COMPOSE_PROJECT_NAME
#
# What it does:
#   1. Refuses a branch other than main unless the project is a test one (its name
#      ends in -test), so production only ever runs main.
#   2. Refuses if tracked files have local changes, so nothing is overwritten.
#   3. Fetches the branch from GitHub and checks out exactly what's there.
#   4. Rebuilds what changed and restarts those containers (docker compose up --build -d).
#   5. Waits until every container is running (and healthy, where it has a health
#      check), then until /api/health/db answers 200 over HTTPS with a valid
#      certificate: Tailscale, the certificate, Caddy, the API and Postgres in one request.
#   6. Prints one OK or FAILED line, also written to the journal:
#      journalctl -t studystack-deploy
#
# On a failure, nothing is rolled back: the containers keep whatever state they
# reached. Deploying the previous branch (or main) again is the undo.
#
# The copy of this script that runs is the checked-out branch's. A branch created
# before this script existed doesn't have it; to get back from one, run
# "git checkout main" in the repo folder, then ops/deploy.sh again.
#
# The whole script is one function, called on the last line, so bash has read all
# of it before git checkout can replace this file with another branch's version.

set -euo pipefail

main() {
  # --- Settings (each can be overridden from the environment, e.g. for testing) ---
  local repo_dir="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
  local tailnet="${TAILNET:-tail63e067.ts.net}"
  local wait_seconds="${WAIT_SECONDS:-180}"
  local log_tag="studystack-deploy"
  local branch="${1:-main}"

  log() {
    logger -t "$log_tag" -- "$*" 2>/dev/null || true
    echo "$*" >&2
  }
  fail() {
    log "FAILED: $*"
    exit 1
  }
  step() {
    echo "== $*" >&2
  }

  if (( $# > 1 )); then
    echo "usage: ops/deploy.sh [branch]   (default: main)" >&2
    exit 2
  fi
  if (( EUID == 0 )); then
    echo "Run this as your normal user, without sudo; it uses sudo for docker itself." >&2
    exit 2
  fi

  cd "$repo_dir" || fail "cannot cd to $repo_dir"
  [[ -f .env ]] || fail "no .env in $repo_dir"

  # Which compose files: an environment's .env names them in COMPOSE_FILE, and docker
  # compose reads that from .env by itself. The VM's .env doesn't, so name the file.
  # (An exported variable wouldn't work: sudo doesn't pass the environment through.)
  local -a compose=(docker compose)
  if ! grep -q '^COMPOSE_FILE=' .env; then
    compose+=(-f docker-compose.prod.yml)
  fi

  # The project name decides what may be deployed: config prints "name: <project>" first.
  local project
  project="$("${compose[@]}" config 2>/dev/null | sed -n '1s/^name: //p')"
  [[ -n "$project" ]] || fail "docker compose config failed in $repo_dir (run it by hand to see why)"

  # 1. Production only ever runs main.
  if [[ "$branch" != "main" && "$project" != *-test ]]; then
    fail "$project is not a test environment; only main can be deployed here (asked for '$branch')"
  fi

  # 2. Local changes to tracked files would be lost or block the checkout. .env and
  #    other untracked or ignored files don't count.
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    git status --short --untracked-files=no >&2
    fail "local changes in $repo_dir (listed above); undo them with 'git checkout -- <file>' first"
  fi

  # Ask for the sudo password now, not halfway through the deploy.
  sudo -v

  local before
  before="$(git rev-parse --short HEAD 2>/dev/null || echo none)"

  # 3. Fetch just this branch (an explicit refspec works whatever the clone's fetch
  #    settings), then point the local branch at it. Servers never commit, so the
  #    local branch is always just a copy of GitHub's.
  step "fetching $branch"
  git fetch --quiet origin "+refs/heads/$branch:refs/remotes/origin/$branch" \
    || fail "could not fetch '$branch' from origin (is it pushed? is the name right?)"
  git checkout --quiet -B "$branch" "origin/$branch" \
    || fail "git could not check out '$branch' in $repo_dir (see git's message above)"
  local after subject
  after="$(git rev-parse --short HEAD)"
  subject="$(git log -1 --format=%s)"
  echo "   $before -> $after  $subject" >&2

  # 4. Build and start. Only containers whose image or settings changed are recreated.
  step "building and starting $project"
  sudo "${compose[@]}" up --build -d || fail "docker compose up failed for $project at $after"

  # 5a. Containers: every service running, and healthy if it has a health check.
  step "waiting for the containers (up to ${wait_seconds}s)"
  local deadline=$((SECONDS + wait_seconds)) problem="" service id state health
  local -a services
  mapfile -t services < <("${compose[@]}" config --services)
  while :; do
    problem=""
    for service in "${services[@]}"; do
      id="$(sudo "${compose[@]}" ps -a -q "$service" 2>/dev/null)"
      if [[ -z "$id" ]]; then
        problem="$service: no container"
        break
      fi
      state="$(sudo docker inspect -f '{{.State.Status}}' "$id" 2>/dev/null || true)"
      health="$(sudo docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$id" 2>/dev/null || true)"
      if [[ "$state" != "running" ]]; then
        problem="$service: container is ${state:-unknown}"
        break
      fi
      if [[ -n "$health" && "$health" != "healthy" ]]; then
        problem="$service: health is $health"
        break
      fi
    done
    [[ -z "$problem" ]] && break
    (( SECONDS < deadline )) || fail "$problem after ${wait_seconds}s (see: sudo ${compose[*]} logs --tail 50 ${service})"
    sleep 3
  done

  # 5b. The whole path. The VM's .env has SITE_ADDRESS, which it can resolve. An
  #     environment has TS_HOSTNAME instead, and homeserver can't resolve *.ts.net
  #     names, so curl is given the machine's Tailscale IP with --resolve, which keeps
  #     the normal certificate check for the real name.
  local site resolve_ip="" url code=""
  site="$(sed -n 's/^SITE_ADDRESS=//p' .env | tail -1)"
  if [[ -z "$site" ]]; then
    local ts_hostname
    ts_hostname="$(sed -n 's/^TS_HOSTNAME=//p' .env | tail -1)"
    [[ -n "$ts_hostname" ]] || fail "neither SITE_ADDRESS nor TS_HOSTNAME is set in .env"
    site="$ts_hostname.$tailnet"
  fi
  url="https://$site/api/health/db"
  step "waiting for $url"
  local -a curl_args=(-sS -m 10 -o /dev/null -w '%{http_code}')
  while :; do
    if [[ "$site" == *."$tailnet" && -z "$resolve_ip" ]]; then
      resolve_ip="$(tailscale ip -4 "${site%%.*}" 2>/dev/null | head -1 || true)"
    fi
    if [[ -n "$resolve_ip" ]]; then
      code="$(curl "${curl_args[@]}" --resolve "$site:443:$resolve_ip" "$url" 2>/dev/null || true)"
    else
      code="$(curl "${curl_args[@]}" "$url" 2>/dev/null || true)"
    fi
    [[ "$code" == "200" ]] && break
    (( SECONDS < deadline )) || fail "$url answered ${code:-000} after ${wait_seconds}s (see: sudo ${compose[*]} logs --tail 50 api)"
    sleep 3
  done

  # 6. Done.
  log "OK deployed $branch at $after ($subject) to $project; was $before"
}

main "$@"
exit
