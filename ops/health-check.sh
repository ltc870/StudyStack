#!/usr/bin/env bash
# StudyStack: health check for the server, the containers and the app.
#
# Run as root every 5 minutes by /etc/cron.d/studystack-health (see ops/studystack-health.cron),
# or by hand with: sudo ~/StudyStack/ops/health-check.sh
#
# Checks:
#   1. postgres, api and caddy each have a running container, and postgres is healthy.
#   2. https://<SITE_ADDRESS>/api/health/db answers 200 with a valid certificate
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
COMPOSE_FILE="docker-compose.prod.yml"
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

# The health address comes from SITE_ADDRESS in .env (the machine's MagicDNS name), so
# the same script works on the home lab without editing. Only that line is read.
if [[ -z "${HEALTH_URL:-}" ]]; then
  site="$(grep -m1 '^SITE_ADDRESS=' .env 2>/dev/null | cut -d= -f2- || true)"
  if [[ -n "$site" ]]; then
    HEALTH_URL="https://$site/api/health/db"
  fi
fi

# 1. Containers. "docker compose ps -a -q <service>" prints the service's container ID
#    (also when it is stopped); "docker inspect" reports its state and health.
for service in postgres api caddy; do
  id="$(docker compose -f "$COMPOSE_FILE" ps -a -q "$service" 2>/dev/null)"
  if [[ -z "$id" ]]; then
    fail "$service: no container"
    continue
  fi
  state="$(docker inspect -f '{{.State.Status}}' "$id" 2>/dev/null)"
  if [[ "$state" != "running" ]]; then
    fail "$service: container is ${state:-unknown}"
    continue
  fi
  if [[ "$service" == "postgres" ]]; then
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$id" 2>/dev/null)"
    if [[ "$health" != "healthy" ]]; then
      fail "postgres: health is ${health:-unknown}"
    fi
  fi
done
say "containers checked"

# 2. The whole path, API -> database included. curl checks the certificate as usual
#    (no -k). -w prints the HTTP status; 000 means no answer at all.
if [[ -z "${HEALTH_URL:-}" ]]; then
  fail "api: SITE_ADDRESS is not set in $REPO_DIR/.env"
else
  curl_error="$(mktemp)"
  code="$(curl -sS -m 20 -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>"$curl_error")"
  if [[ "$code" != "200" ]]; then
    fail "api: $HEALTH_URL answered ${code:-000} $(tr '\n' ' ' <"$curl_error")"
  fi
  rm -f "$curl_error"
fi
say "endpoint checked: $HEALTH_URL"

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