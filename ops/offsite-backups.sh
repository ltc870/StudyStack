#!/usr/bin/env bash
# StudyStack: copy the production database dumps off the home lab, encrypted, to
# Backblaze B2 (runs on homeserver).
#
# Run as root, daily, by /etc/cron.d/studystack-offsite (see ops/studystack-offsite.cron),
# or by hand from the production folder with: sudo ops/offsite-backups.sh
#
# What it does:
#   1. Uploads every studystack-*.dump in SOURCE_DIR that isn't off-site yet, with
#      rclone copy to REMOTE: an rclone crypt remote, so each dump and its name are
#      encrypted on homeserver before they leave. copy never deletes anything, so the
#      off-site copies outlive the 30 days backup-db.sh keeps locally.
#   2. Checks that the newest local dump is now listed off-site.
#   3. Reports to Healthchecks.io, if PING_URL_FILE holds a ping URL.
#
# The B2 key in root's rclone config can list and upload in one bucket, but can't
# download or delete (no readFiles, no deleteFiles). Restoring needs a separate
# read-only key and the two crypt passwords, which live only in the password manager.
# Every message goes to the systemd journal: journalctl -t studystack-offsite

set -euo pipefail

# --- Settings (each can be overridden from the environment, e.g. for testing) ---
SOURCE_DIR="${SOURCE_DIR:-/var/backups/studystack}"
REMOTE="${REMOTE:-studystack-offsite:}"
export RCLONE_CONFIG="${RCLONE_CONFIG:-/root/.config/rclone/rclone.conf}"
PING_URL_FILE="${PING_URL_FILE:-/etc/studystack/offsite-healthcheck-url}"
LOG_TAG="studystack-offsite"

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

# The newest local dump: the one that must be off-site when this run ends.
newest="$(find "$SOURCE_DIR" -maxdepth 1 -type f -name 'studystack-*.dump' \
  -printf '%f\n' 2>/dev/null | sort | tail -1)"
if [[ -z "$newest" ]]; then
  fail "no studystack-*.dump in $SOURCE_DIR; nothing to upload"
fi

# 1. Upload. --include skips anything else (such as a .partial dump still being
#    written). -v prints one "Copied (new)" line per uploaded dump. The timeouts make a
#    dead network fail the run instead of hanging it; timeout(1) caps the whole upload.
if ! timeout 30m rclone copy "$SOURCE_DIR" "$REMOTE" --include 'studystack-*.dump' \
    --contimeout 30s --timeout 5m -v >"$output" 2>&1; then
  fail "rclone copy: $(grep -E 'ERROR|NOTICE|Failed' "$output" | tail -3 | tr '\n' ' ')"
fi
uploaded="$(grep -c ': Copied (new)' "$output" || true)"

# 2. Check. List what's off-site (names are decrypted by the crypt remote).
if ! timeout 10m rclone lsf "$REMOTE" --include 'studystack-*.dump' \
    --contimeout 30s --timeout 5m >"$output" 2>&1; then
  fail "rclone lsf: $(tail -3 "$output" | tr '\n' ' ')"
fi
if ! grep -qxF "$newest" "$output"; then
  fail "$newest is not listed off-site after the upload"
fi
total="$(grep -c '^studystack-.*\.dump$' "$output" || true)"

summary="uploaded $uploaded new dump(s); $total dumps off-site, newest $newest"
log "OK $summary"
report "" "$summary"
