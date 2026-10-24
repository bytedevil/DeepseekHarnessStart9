#!/bin/sh
# Runs `dsh web` on loopback plus the relay that exposes it to StartOS.
# If either child dies, exit nonzero so StartOS restarts the daemon.
# POSIX sh only.

set -u

DSH_WEB_PORT="${DSH_WEB_PORT:-4200}"
PROXY_PORT="${PROXY_PORT:-4201}"
PROJECTS_DIR="${PROJECTS_DIR:-/data/projects}"
export PROXY_PORT TARGET_PORT="$DSH_WEB_PORT"

# dsh takes its workspace root from the invoking directory.
mkdir -p "$PROJECTS_DIR" "${DSH_HOME:-/data/dsh}"
cd "$PROJECTS_DIR" || { echo "[webui] cannot cd into $PROJECTS_DIR"; exit 1; }

# Word-splitting is the point: one --trusted-host per authority.
TRUSTED=""
for authority in ${DSH_TRUSTED_HOSTS:-}; do
  TRUSTED="$TRUSTED --trusted-host $authority"
done

echo "[webui] workspace: $PROJECTS_DIR (uid $(id -u))"
echo "[webui] starting dsh web on 127.0.0.1:$DSH_WEB_PORT${TRUSTED:+ (trusted:${DSH_TRUSTED_HOSTS})}"
# shellcheck disable=SC2086
dsh web --port "$DSH_WEB_PORT" --no-open $TRUSTED &
DSH_PID=$!

echo "[webui] starting http/ws relay on 0.0.0.0:$PROXY_PORT -> 127.0.0.1:$DSH_WEB_PORT"
node /app/web-proxy.js &
PROXY_PID=$!

trap 'kill "$DSH_PID" "$PROXY_PID" 2>/dev/null; exit 0' TERM INT

while kill -0 "$DSH_PID" 2>/dev/null && kill -0 "$PROXY_PID" 2>/dev/null; do
  sleep 1
done

echo "[webui] a child process died — exiting so StartOS restarts the daemon"
exit 1
