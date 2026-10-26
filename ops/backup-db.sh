#!/usr/bin/env bash
# StudyStack: back up the production database with pg_dump.
#
# Run as root, nightly, by /etc/cron.d/studystack-backup (see ops/studystack-backup.cron),
# or by hand with: sudo ~/StudyStack/ops/backup-db.sh
#
# What it does:
#   1. Runs pg_dump inside the postgres container (custom format, -Fc). The container
#      trusts its own Unix socket, so this script never reads or handles a password.
#   2. Writes to a .partial file, checks it, then renames it to
#      studystack-<UTC timestamp>.dump in BACKUP_DIR.
#   3. Only after a successful backup, deletes studystack-*.dump files older than
#      RETENTION_DAYS. manual-*.dump files are never deleted.
# It backs up the stack its own repo folder belongs to:
#   - the VM:         ~/StudyStack (docker-compose.prod.yml, project studystack-prod)
#   - an environment: ~/applications/environments/production/studystack-prod on homeserver,
#                     whose .env sets COMPOSE_FILE and COMPOSE_PROJECT_NAME
# It refuses to run for a test environment (a project name ending in -test), whose data
# is only a copy of production's and must never mix with production's dumps.
# Every message goes to the systemd journal: journalctl -t studystack-backup

set -euo pipefail

# --- Settings (each can be overridden from the environment, e.g. for testing) ---
# The repo folder is the parent of this script's folder, so the same script works on
# any server without editing (the VM, or the production folder on homeserver).
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/studystack}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_TAG="studystack-backup"

# New files are readable and writable by root, readable by the backup folder's group,
# and closed to everyone else (mode 640): a dump contains everything in the database,
# including password hashes. BACKUP_DIR is owned by group studystack-backup with the
# setgid bit (mode 2750), so every new dump inherits that group, and the pull-only
# backup-pull user (a member) can copy the dumps off the server without sudo.
umask 027

# Log to the journal, and also to the screen when run by hand from a terminal.
log() {
  logger -t "$LOG_TAG" -- "$*"
  if [[ -t 2 ]]; then
    echo "$*" >&2
  fi
}

fail() {
  log "FAILED: $*"
  exit 1
}

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
final="$BACKUP_DIR/studystack-$timestamp.dump"
partial="$final.partial"
errors="$(mktemp)"
listing="$(mktemp)"

# Whatever happens, remove the temporary files and any half-written dump.
# (After a successful rename, the .partial file no longer exists.)
trap 'rm -f "$partial" "$errors" "$listing"' EXIT

cd "$REPO_DIR" || fail "cannot cd to $REPO_DIR"   # so docker compose finds the compose files and .env

# Which compose files: an environment's .env names them in COMPOSE_FILE, and docker
# compose reads that from .env by itself. The VM's .env doesn't, so name the file.
# (The same rule as ops/deploy.sh.)
compose=(docker compose)
if ! grep -q '^COMPOSE_FILE=' .env 2>/dev/null; then
  compose+=(-f docker-compose.prod.yml)
fi

# Production only: config prints "name: <project>" first.
project="$("${compose[@]}" config 2>/dev/null | sed -n '1s/^name: //p' || true)"
if [[ -z "$project" ]]; then
  fail "docker compose config failed in $REPO_DIR (run it by hand to see why)"
fi
if [[ "$project" == *-test ]]; then
  fail "$project is a test environment; only production is backed up"
fi

mkdir -p "$BACKUP_DIR"

# 1. Dump. The single quotes make the container's shell expand $POSTGRES_USER and
#    $POSTGRES_DB from the container's own environment.
# shellcheck disable=SC2016  # the single quotes are on purpose (see above)
if ! "${compose[@]}" exec -T postgres \
    sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
    >"$partial" 2>"$errors"; then
  fail "pg_dump: $(tr '\n' ' ' <"$errors")"
fi

# 2. Check. Not empty, and pg_restore can read its table of contents. This catches an
#    empty or garbage file; only a real restore proves a dump is good.
if [[ ! -s "$partial" ]]; then
  fail "the dump is empty"
fi
if ! "${compose[@]}" exec -T postgres pg_restore --list \
    <"$partial" >"$listing" 2>"$errors"; then
  fail "pg_restore --list: $(tr '\n' ' ' <"$errors")"
fi
tables="$(grep -c ' TABLE DATA ' "$listing" || true)"
if [[ "$tables" -eq 0 ]]; then
  fail "the dump contains no table data"
fi

mv "$partial" "$final"
size="$(stat -c %s "$final")"

# 3. Prune. -mtime +N matches files at least N+1 whole days old, so +(RETENTION_DAYS - 1)
#    keeps the dumps from the last RETENTION_DAYS days. Leftover .partial files from a
#    run that was killed outright (the trap can't run then) are removed after a day.
pruned="$(find "$BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'studystack-*.dump' -mtime +"$((RETENTION_DAYS - 1))" \
  -o -name 'studystack-*.dump.partial' -mtime +0 \) \
  -print -delete | wc -l)"
kept="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'studystack-*.dump' | wc -l)"

log "OK $(basename "$final") ($project): $size bytes, $tables tables; pruned $pruned, $kept dumps kept"
