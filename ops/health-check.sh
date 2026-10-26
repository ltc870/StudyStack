#!/usr/bin/env bash
# StudyStack: health check for the server, the containers and the app.
#
# Run as root every 5 minutes by /etc/cron.d/studystack-health (see ops/studystack-health.cron),
# or by hand from the stack's repo folder with: sudo ops/health-check.sh
#
# It checks the stack its own repo folder belongs to:
#   - the VM:         ~/StudyStack (docker-compose.prod.yml, project studystack-prod)
#   - an environment: ~/applications/environments/production/studystack-prod on homeserver,
#                     whose .env sets COMPOSE_FILE and COMPOSE_PROJECT_NAME
#
# Checks:
#   1. Every service in the stack has a running container, and every container with a
#      health check is healthy (postgres, api, caddy, plus tailscale on homeserver).
#   2. https://<machine>/api/health/db answers 200 with a valid certificate
#      (proves Tailscale, the certificate, Caddy, the API and Postgres in one request).
#   3. The root disk is less than DISK_LIMIT percent full.
#   4. A nightly dump (studystack-*.dump) is less than BACKUP_MAX_AGE_HOURS old.
#
# Reporting: every run pings Healthchecks.io, at the URL stored in PING_URL_FILE
# (root-only, never in the repo). All checks pass -> a success ping. Any check fails ->
# a ping to <url>/fail with the failures as the message, and each failure is written
# to the journal (journalctl -t studystack-health). If the pings stop entirely (the
# server is down), Healthchecks.io notices the silence and alerts too.

# No "set -e": every check must run even if an earlier one fails.
set -uo pipefail

# --- Settings (each can be overridden from the environment, e.g. for testing) ---
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/studystack}"
PING_URL_FILE="${PING_URL_FILE:-/etc/studystack/healthcheck-url}"
DISK_LIMIT="${DISK_LIMIT:-85}"
BACKUP_MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-26}"
TAILNET="${TAILNET:-tail63e067.ts.net}"
LOG_TAG="studystack-health"

failures=()

# Record a failed check. Each failure goes to the journal (and the screen when run
# by hand); all of them together become the message of the /fail ping.
fail() {
  failures+=("$*")
  logger -t "$LOG_TAG" -- "FAILED: $*"
  if [[ -t 2 ]]; then
    echo "FAILED: $*" >&2
  fi
}

# Messages that only matter when someone is watching (run by hand from a terminal).
say() {
  if [[ -t 2 ]]; then
    echo "$*" >&2
  fi
}

cd "$REPO_DIR" || { logger -t "$LOG_TAG" -- "FAILED: cannot cd to $REPO_DIR"; exit 1; }

# Which compose files: an environment's .env names them in COMPOSE_FILE, and docker
# compose reads that from .env by itself. The VM's .env doesn't, so name the file.
# (The same rule as ops/deploy.sh.)
compose=(docker compose)
if ! grep -q '^COMPOSE_FILE=' .env 2>/dev/null; then
  compose+=(-f docker-compose.prod.yml)
fi

# The health address. The VM's .env has SITE_ADDRESS (its MagicDNS name). An environment
# has TS_HOSTNAME instead, and homeserver can't resolve *.ts.net names, so curl is given
# the machine's Tailscale IP with --resolve, which keeps the normal certificate check for
# the real name. Only those two lines of .env are read.
resolve=()
if [[ -z "${HEALTH_URL:-}" ]]; then
  site="$(sed -n 's/^SITE_ADDRESS=//p' .env 2>/dev/null | tail -1)"
  if [[ -z "$site" ]]; then
    ts_hostname="$(sed -n 's/^TS_HOSTNAME=//p' .env 2>/dev/null | tail -1)"
    if [[ -n "$ts_hostname" ]]; then
      site="$ts_hostname.$TAILNET"
    fi
  fi
  if [[ -n "$site" ]]; then
    HEALTH_URL="https://$site/api/health/db"
    if [[ "$site" == *."$TAILNET" ]]; then
      # "tailscale ip" asks Tailscale itself, so it works without DNS.
      resolve_ip="$(tailscale ip -4 "${site%%.*}" 2>/dev/null | head -1 || true)"
      if [[ -n "$resolve_ip" ]]; then
        resolve=(--resolve "$site:443:$resolve_ip")
      fi
    fi
  fi
fi

# 1. Containers. "docker compose config --services" lists every service in the stack;
#    "docker compose ps -a -q <service>" prints its container ID (also when it is
#    stopped); "docker inspect" reports its state and, if it has a health check, health.
services=()
mapfile -t services < <("${compose[@]}" config --services 2>/dev/null)
if (( ${#services[@]} == 0 )); then
  fail "containers: docker compose config failed in $REPO_DIR (run it by hand to see why)"
fi
for service in "${services[@]}"; do
  id="$("${compose[@]}" ps -a -q "$service" 2>/dev/null)"
  if [[ -z "$id" ]]; then
    fail "$service: no container"
    continue
  fi
  state="$(docker inspect -f '{{.State.Status}}' "$id" 2>/dev/null)"
  if [[ "$state" != "running" ]]; then
    fail "$service: container is ${state:-unknown}"
    continue
  fi
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$id" 2>/dev/null)"
  if [[ -n "$health" && "$health" != "healthy" ]]; then
    fail "$service: health is $health"
  fi
done
say "containers checked: ${services[*]}"

# 2. The whole path, API -> database included. curl checks the certificate as usual
#    (no -k). -w prints the HTTP status; 000 means no answer at all.
if [[ -z "${HEALTH_URL:-}" ]]; then
  fail "api: neither SITE_ADDRESS nor TS_HOSTNAME is set in $REPO_DIR/.env"
else
  curl_error="$(mktemp)"
  code="$(curl -sS -m 20 -o /dev/null -w '%{http_code}' "${resolve[@]}" "$HEALTH_URL" 2>"$curl_error")"
  if [[ "$code" != "200" ]]; then
    fail "api: $HEALTH_URL answered ${code:-000} $(tr '\n' ' ' <"$curl_error")"
  fi
  rm -f "$curl_error"
fi
say "endpoint checked: ${HEALTH_URL:-none}${resolve[1]:+ (via ${resolve[1]##*:})}"

# 3. Disk. df prints the root filesystem's use as, e.g., " 23%"; keep only the digits.
used="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
if [[ -z "$used" ]] || (( used >= DISK_LIMIT )); then
  fail "disk: / is ${used:-?}% full (limit $DISK_LIMIT%)"
fi
say "disk checked: ${used:-?}% used"

# 4. Backups. -mmin -N matches files changed less than N minutes ago.
recent="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'studystack-*.dump' \
  -mmin -"$((BACKUP_MAX_AGE_HOURS * 60))" 2>/dev/null | head -1)"
if [[ -z "$recent" ]]; then
  fail "backup: no studystack-*.dump in $BACKUP_DIR from the last $BACKUP_MAX_AGE_HOURS hours"
fi
say "backups checked"

# Report to Healthchecks.io. The URL is a secret: anyone with it can send pings.
ping_url="$(tr -d '[:space:]' 2>/dev/null <"$PING_URL_FILE" || true)"
if [[ -z "$ping_url" ]]; then
  logger -t "$LOG_TAG" -- "FAILED: no ping URL in $PING_URL_FILE; nothing was reported"
  say "FAILED: no ping URL in $PING_URL_FILE"
  exit 1
fi

if (( ${#failures[@]} == 0 )); then
  target="$ping_url"
  message="all checks passed"
else
  target="$ping_url/fail"
  message="$(printf '%s\n' "${failures[@]}")"
fi

# --retry covers a brief network hiccup; -m caps each attempt at 10 seconds.
if ! curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "$message" "$target" 2>/dev/null; then
  logger -t "$LOG_TAG" -- "FAILED: could not reach Healthchecks.io"
  say "FAILED: could not reach Healthchecks.io"
fi

if (( ${#failures[@]} == 0 )); then
  say "OK: all checks passed (reported to Healthchecks.io)"
  exit 0
fi
say "reported ${#failures[@]} failure(s) to Healthchecks.io"
exit 1
