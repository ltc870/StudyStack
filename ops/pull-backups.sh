#!/usr/bin/env bash
# StudyStack: copy the production database dumps off the server (runs on homeserver).
#
# Run as root, daily, by /etc/cron.d/studystack-pull (see ops/studystack-pull.cron),
# or by hand with: sudo ~/StudyStack/ops/pull-backups.sh
#
# What it does:
#   1. Refuses to run unless the external drive is mounted, so the copies can never
#      land on the system disk under an empty mount point.
#   2. Pulls every dump it doesn't have yet from the server with rsync, over SSH as
#      the pull-only backup-pull user. That user's key is limited on the server to
#      read-only rsync of /var/backups/studystack (rrsync -ro).
#   3. Never deletes anything: dumps the server prunes after 30 days stay here.
#   4. If PING_URL_FILE holds a Healthchecks.io ping URL, reports success or failure
#      there; without it, the run only writes to the journal.
# Every message goes to the systemd journal: journalctl -t studystack-pull

set -euo pipefail

# --- Settings (each can be overridden from the environment, e.g. for testing) ---
SOURCE="${SOURCE:-backup-pull@studystack.tail63e067.ts.net:}"
SSH_KEY="${SSH_KEY:-/root/.ssh/studystack-backup-pull}"
MOUNT_POINT="${MOUNT_POINT:-/mnt/storage}"
DEST_DIR="${DEST_DIR:-/mnt/storage/backups/studystack}"
PING_URL_FILE="${PING_URL_FILE:-/etc/studystack/pull-healthcheck-url}"
LOG_TAG="studystack-pull"

# Log to the journal, and also to the screen when run by hand from a terminal.
log() {
  logger -t "$LOG_TAG" -- "$*"
  if [[ -t 2 ]]; then
    echo "$*" >&2
  fi
}

# Report to Healthchecks.io if a ping URL is configured. The URL is a secret: anyone
# with it can send pings. A failed report is logged but never hides the real result.
report() {
  local suffix="$1" message="$2" ping_url
  ping_url="$(tr -d '[:space:]' 2>/dev/null <"$PING_URL_FILE" || true)"
  if [[ -z "$ping_url" ]]; then
    return 0
  fi
  if ! curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "$message" \
      "$ping_url$suffix" 2>/dev/null; then
    logger -t "$LOG_TAG" -- "FAILED: could not reach Healthchecks.io"
  fi
}

fail() {
  log "FAILED: $*"
  report "/fail" "$*"
  exit 1
}

output="$(mktemp)"
trap 'rm -f "$output"' EXIT

# 1. The drive. mountpoint -q succeeds only if something is mounted there.
if ! mountpoint -q "$MOUNT_POINT"; then
  fail "$MOUNT_POINT is not mounted; nothing was copied"
fi
if [[ ! -d "$DEST_DIR" ]]; then
  fail "$DEST_DIR does not exist (create it once with: install -d -m 2750 -o root -g www-data $DEST_DIR)"
fi

# 2. Pull. -r copies the folder's contents, -t keeps each dump's original time (so the
#    next run knows what it already has), --chmod=F640 makes every copy rw-r-----.
#    The folder's setgid bit gives each copy the folder's group (www-data, for Nextcloud).
#    --exclude skips a dump the server is still writing. BatchMode makes ssh fail
#    instead of waiting for a password or a host-key question nobody will answer.
if ! rsync -rt --chmod=F640 --exclude='*.partial' --itemize-changes \
    -e "ssh -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=30" \
    "$SOURCE" "$DEST_DIR/" >"$output" 2>&1; then
  fail "rsync: $(tr '\n' ' ' <"$output")"
fi

# --itemize-changes prints one line per copied file, starting with ">f".
copied="$(grep -c '^>f' "$output" || true)"
total="$(find "$DEST_DIR" -maxdepth 1 -type f -name '*.dump' | wc -l)"

log "OK copied $copied new dump(s); $total dumps in $DEST_DIR"
report "" "copied $copied new dump(s); $total dumps in $DEST_DIR"
