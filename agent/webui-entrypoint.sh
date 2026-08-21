#!/bin/sh
# Web UI supervisor: runs `dsh web` (loopback-only by upstream design)
# plus the TCP forwarder that exposes it to StartOS on $PROXY_PORT.
# The python agent runs in its own daemon — do NOT start it here.
#
# If either child dies, exit nonzero so StartOS restarts the daemon.
# POSIX sh only (no arrays): build the trusted-host list as a string.

set -u

DSH_WEB_PORT="${DSH_WEB_PORT:-4200}"
PROXY_PORT="${PROXY_PORT:-4201}"
PROJECTS_DIR="${PROJECTS_DIR:-/data/projects}"
export PROXY_PORT TARGET_PORT="$DSH_WEB_PORT"

# dsh uses the invoking directory as its workspace root (process.cwd()):
# every project the UI creates lands under /data/projects, on the
# persistent volume, owned by the service user.
mkdir -p "$PROJECTS_DIR"
chmod 775 "$PROJECTS_DIR" 2>/dev/null || true
cd "$PROJECTS_DIR" || { echo "[webui] cannot cd into $PROJECTS_DIR"; exit 1; }

# dsh's browser-trust fence only accepts Host: 127.0.0.1 or LAN IP
# literals (anti-DNS-rebinding). Users reach the UI through the server's
# mDNS name (e.g. node.local:PORT), so whitelist every plausible
# authority: the container hostname, its .local form, and node.local.
HOSTNAME_VAL="$(hostname 2>/dev/null || echo server)"
TRUSTED="--trusted-host ${HOSTNAME_VAL}:${PROXY_PORT}"
TRUSTED="$TRUSTED --trusted-host ${HOSTNAME_VAL}.local:${PROXY_PORT}"
TRUSTED="$TRUSTED --trusted-host node.local:${PROXY_PORT}"

echo "[webui] workspace: $PROJECTS_DIR (uid $(id -u))"
echo "[webui] starting dsh web on 127.0.0.1:$DSH_WEB_PORT ($TRUSTED)"
dsh web --port "$DSH_WEB_PORT" --no-open $TRUSTED &
DSH_PID=$!

echo "[webui] starting tcp proxy on 0.0.0.0:$PROXY_PORT -> 127.0.0.1:$DSH_WEB_PORT"
node /app/web-proxy.js &
PROXY_PID=$!

trap 'kill "$DSH_PID" "$PROXY_PID" 2>/dev/null; exit 0' TERM INT

while kill -0 "$DSH_PID" 2>/dev/null && kill -0 "$PROXY_PID" 2>/dev/null; do
  sleep 1
done

echo "[webui] a child process died — exiting so StartOS restarts the daemon"
exit 1
