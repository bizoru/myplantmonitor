#!/usr/bin/env bash
# Bootstrap the Mosquitto password file on the EC2.
#
# Run AFTER `docker compose up -d` brings the mosquitto container up at least
# once (so the volume + config dir exist). Reads MQTT_USER and MQTT_PASSWORD
# from the parent .env file.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="$(cd "$HERE/.." && pwd)"
REPO_ROOT="$(cd "$STACK_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found. Copy .env.example and fill it in first." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
. "$ENV_FILE"
set +a

if [[ -z "${MQTT_USER:-}" || -z "${MQTT_PASSWORD:-}" ]]; then
  echo "error: MQTT_USER or MQTT_PASSWORD missing from .env" >&2
  exit 1
fi

PASSWD_FILE="$HERE/passwd"

# Make sure the file exists (mosquitto_passwd -c is destructive).
: > "$PASSWD_FILE"
chmod 644 "$PASSWD_FILE"

# mosquitto_passwd lives inside the container. Mount the host file in.
docker run --rm \
  -v "$PASSWD_FILE:/tmp/passwd" \
  eclipse-mosquitto:2.0 \
  mosquitto_passwd -b /tmp/passwd "$MQTT_USER" "$MQTT_PASSWORD"

echo "ok: wrote $PASSWD_FILE for user '$MQTT_USER'"
echo "next: docker compose restart mosquitto"
