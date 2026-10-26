#!/usr/bin/env bash
# StudyStack: copy the production database dumps to homeserver's external drive.
#
# Run as root on homeserver, daily, by /etc/cron.d/studystack-pull (see
# ops/studystack-pull.cron), or by hand from the production folder with:
#   sudo ops/pull-backups.sh
#
# Since Phase 7 production runs on homeserver itself, so by default the dumps come from
# its own /var/backups/studystack (on the system disk, next to the database) and go to
# the external drive: a second disk. Until Oct 26, 2026 they were pulled from the cloud
# VM over SSH; a SOURCE of the form user@host: still does that (see Settings).
#
# What it does:
#   1. Refuses to run unless the external drive is mounted, so the copies can never
#      land on the system disk under an empty mount point.
#   2. Copies every dump it doesn't have yet from SOURCE with rsync. For a local SOURCE,
#      rsync copies between the two folders directly and ignores its SSH settings.
#   3. Never deletes anything: dumps backup-db.sh prunes after 30 days stay here.
#   4. When new dumps arrived, tells Nextcloud to rescan its "StudyStack backups"
#      folder. Nextcloud lists files from its own cache and doesn't notice files that
#      appear on External storage by themselves. A failed rescan is logged as a WARNING
#      but doesn't fail the run, because the copies themselves are safe.
#   5. If PING_URL_FILE holds a Healthchecks.io ping URL, reports success or failure
#      there; without it, the run only writes to the journal.
# Every message goes to the systemd journal: journalctl -t studystack-pull

set -euo pipefail

# --- Settings (each can be overridden from the environment, e.g. for testing) ---
# Where the dumps come from: a local folder (the default), or user@host: for a server
# reached over SSH with SSH_KEY.
SOURCE="${SOURCE:-/var/backups/studystack/}"
SSH_KEY="${SSH_KEY:-/root/.ssh/studystack-backup-pull}"
MOUNT_POINT="${MOUNT_POINT:-/mnt/storage}"
DEST_DIR="${DEST_DIR:-/mnt/storage/backups/studystack}"
PING_URL_FILE="${PING_URL_FILE:-/etc/studystack/pull-healthcheck-url}"
# Nextcloud's container and the folder to rescan: the Nextcloud user (casaos), then
# "files", then the External storage mount's name. An empty NEXTCLOUD_CONTAINER skips
# the rescan.
NEXTCLOUD_CONTAINER="${NEXTCLOUD_CONTAINER-nextcloud}"
NEXTCLOUD_SCAN_PATH="${NEXTCLOUD_SCAN_PATH:-/casaos/files/StudyStack backups}"
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

# 2. Copy. -r copies the folder's contents, -t keeps each dump's original time (so the
#    next run knows what it already has), --chmod=F640 makes every copy rw-r-----.
#    The folder's setgid bit gives each copy the folder's group (www-data, for Nextcloud).
#    --exclude skips a dump backup-db.sh is still writing. For a remote SOURCE only:
#    BatchMode makes ssh fail instead of waiting for a password or a host-key question
#    nobody will answer.
if ! rsync -rt --chmod=F640 --exclude='*.partial' --itemize-changes \
    -e "ssh -i $SSH_KEY -o BatchMode=yes -o ConnectTimeout=30" \
    "$SOURCE" "$DEST_DIR/" >"$output" 2>&1; then
  fail "rsync: $(tr '\n' ' ' <"$output")"
fi

# --itemize-changes prints one line per copied file, starting with ">f".
copied="$(grep -c '^>f' "$output" || true)"
total="$(find "$DEST_DIR" -maxdepth 1 -type f -name '*.dump' | wc -l)"

summary="copied $copied new dump(s); $total dumps in $DEST_DIR"

# 3. Nextcloud. Only when something new arrived. occ must run as www-data, the user
#    Nextcloud runs as inside its container. timeout keeps a stuck container from
#    holding up the report.
if [[ "$copied" -gt 0 && -n "$NEXTCLOUD_CONTAINER" ]]; then
  if timeout 300 docker exec -u www-data "$NEXTCLOUD_CONTAINER" \
      php occ files:scan --path="$NEXTCLOUD_SCAN_PATH" >"$output" 2>&1; then
    summary="$summary; Nextcloud rescanned"
  else
    log "WARNING: Nextcloud rescan failed (container '$NEXTCLOUD_CONTAINER'): $(tr '\n' ' ' <"$output")"
    summary="$summary; WARNING: Nextcloud rescan failed, see journalctl -t $LOG_TAG"
  fi
fi

log "OK $summary"
report "" "$summary"
