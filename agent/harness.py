"""
DeepSeek Harness — native DeepSeek API agent service.

Talks directly to the official DeepSeek API (https://api.deepseek.com),
unmodified. The API key is injected at runtime via the DEEPSEEK_API_KEY
environment variable (configured through the StartOS service config).

Exposes a minimal HTTP health endpoint (default :8080) that reports
200 while the service is healthy and 503 with details when it is not.
"""

import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

API_URL = "https://api.deepseek.com/chat/completions"
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
POLL_SECONDS = int(os.getenv("HARNESS_POLL_SECONDS", "30"))
HEALTH_PORT = int(os.getenv("HARNESS_HEALTH_PORT", "8080"))
STATE_PATH = os.getenv("HARNESS_STATE", "/data/state.json")

_state_lock = threading.Lock()
_state: dict = {"status": "starting", "runs": 0, "last_ok": None, "last_error": None}


def log(msg: str) -> None:
    print(f"[deepseek-harness] {msg}", flush=True)


def set_status(status: str, **kwargs) -> None:
    with _state_lock:
        _state["status"] = status
        _state.update(kwargs)


def read_api_key() -> str:
    return os.getenv("DEEPSEEK_API_KEY", "").strip()


def call_deepseek(api_key: str, prompt: str) -> str:
    """One unmodified request to the official DeepSeek chat completions endpoint."""
    payload = json.dumps(
        {
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are DeepSeek Harness, an autonomous agent running on a "
                        "self-hosted StartOS server. Be concise and helpful."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        }
    ).encode()

    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.load(resp)
    return body["choices"][0]["message"]["content"]


def save_state() -> None:
    try:
        os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
        tmp = STATE_PATH + ".tmp"
        with open(tmp, "w") as f:
            json.dump(_state, f, indent=2)
        os.replace(tmp, STATE_PATH)
    except Exception as e:
        log(f"warning: could not persist state: {e}")


def healthcheck_once() -> None:
    """Verify the API key works with a minimal completion; record the result."""
    api_key = read_api_key()
    if not api_key:
        set_status("unconfigured", last_error="missing DEEPSEEK_API_KEY")
        log("waiting for DEEPSEEK_API_KEY — configure it in the service settings")
        return
    try:
        reply = call_deepseek(api_key, "Reply with exactly: OK")
        runs = _state.get("runs", 0) + 1
        set_status(
            "ok",
            runs=runs,
            last_ok=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            last_error=None,
            last_error_code=None,
            last_logged_error=None,
            last_reply=reply[:200],
        )
        log(f"healthcheck OK (run {runs}): {reply[:80]!r}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        # 402 Insufficient Balance is an account-state problem, not a
        # transient one — say exactly what to do, and don't repeat it
        # every cycle once it has been reported.
        if e.code == 402:
            msg = (
                "DeepSeek account has no balance. Top up at "
                "https://platform.deepseek.com/ (Usage/Billing) and it will "
                "recover automatically."
            )
            if _state.get("last_error_code") != "insufficient_balance":
                log(msg)
                set_status(
                    "error",
                    last_error=msg,
                    last_error_code="insufficient_balance",
                )
            else:
                set_status("error", last_error=msg, last_error_code="insufficient_balance")
            return
        detail_msg = f"HTTP {e.code}: {detail}"
        set_status("error", last_error=detail_msg, last_error_code=None)
        if _state.get("last_logged_error") != detail_msg:
            log(f"healthcheck failed: {detail_msg}")
    except Exception as e:
        msg = str(e)
        set_status("error", last_error=msg, last_error_code=None)
        if _state.get("last_logged_error") != msg:
            log(f"healthcheck failed: {msg}")


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path not in ("/", "/health"):
            self.send_response(404)
            self.end_headers()
            return
        with _state_lock:
            snapshot = dict(_state)
        healthy = snapshot.get("status") == "ok"
        code = 200 if healthy else 503
        body = json.dumps(snapshot).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):  # noqa: A002 - stdlib signature
        pass


def start_health_server() -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(("0.0.0.0", HEALTH_PORT), HealthHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    log(f"health endpoint listening on :{HEALTH_PORT}")
    return server


def main() -> int:
    log(f"starting — model={MODEL} api=api.deepseek.com (native, unmodified)")
    start_health_server()
    while True:
        healthcheck_once()
        save_state()
        time.sleep(POLL_SECONDS)
    return 0


if __name__ == "__main__":
    sys.exit(main())
