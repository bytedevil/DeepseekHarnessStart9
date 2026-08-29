<p align="center">
  <img src="icon.svg" alt="DeepSeek Harness Logo" width="21%">
</p>

# DeepSeek Harness on StartOS

> Everything not listed in this document should behave the same as upstream
> DeepSeek Harness. If a feature, setting, or behavior is not mentioned here,
> the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

DeepSeek Harness is DeepSeek's own coding agent: a chat interface over a model that can read, write and execute code in a workspace directory. This package runs its browser interface (`dsh web`, from the `@deepseek-ai/dsh` npm package) as a StartOS service, with the workspace and the conversation history on the server's own volume. Upstream ships no authentication, so the package puts the interface behind the OS reverse proxy's basic-auth gate, and adds a health check that tells the user whether DeepSeek is accepting their API key.

- **Upstream repo:** <https://github.com/deepseek-ai/deepseek-harness>
- **Wrapper repo:** <https://github.com/Start9-Community/DeepseekHarnessStart9>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, built from this repository's `Dockerfile` — upstream publishes to npm, not to a container registry, so there is no image to pull.

| Property      | Value                                                    |
| ------------- | -------------------------------------------------------- |
| Image         | Built here, on a Debian-based Node base image            |
| Architectures | x86_64, aarch64                                          |
| Contents      | `@deepseek-ai/dsh` installed globally, plus `bubblewrap` |

| Subcontainer | Purpose                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| `webui`      | `dsh web` plus the relay in front of it — the only subcontainer, and the one to `attach` to |

Two facts about the image are easy to break. `npm install -g` omits `optionalDependencies`, which is where `dsh`'s two native binaries live — ripgrep, for the agent's search tools, and `landlock-run`, for its shell sandbox — so the build unpacks each into the module tree by hand, at the version its parent package asks for. And `dsh` is published only as prereleases whose own dependencies are caret ranges on prereleases, so pinning it does not pin the agent's internals: two builds of the same pin can differ.

## Volume and Data Layout

One volume holds everything: the workspace, the conversations, and the key.

| Volume | Mount Point | Purpose              |
| ------ | ----------- | -------------------- |
| `main` | `/data`     | All persistent state |

| Path               | Written by       | Contents                                                          |
| ------------------ | ---------------- | ----------------------------------------------------------------- |
| `/data/projects`   | the agent, users | Workspace root — project folders and every file the agent writes  |
| `/data/dsh`        | `dsh`            | Its profile home: sessions, settings, and its own credential file |
| `/data/store.json` | this package     | The API key, the model, and the web interface password            |

`/data/projects` is the working directory `dsh web` is launched from, which is what makes it the workspace root the interface offers.

## File Models

One model, `store.json`, holding only what StartOS itself needs to know.

| Model        | File               | Fields                 |
| ------------ | ------------------ | ---------------------- |
| `store.json` | `/data/store.json` | `apiKey`, `uiPassword` |

Each field is written by exactly one action and nothing rewrites it afterwards — `apiKey` by **Set DeepSeek API Key**, `uiPassword` by **Set Web Interface Password**. Neither is consumed as a file by anything in the container: `apiKey` is passed to the daemon as `DEEPSEEK_API_KEY` at launch, so a change restarts it, and `uiPassword` is read reactively by `setupInterfaces` and handed to the OS reverse proxy, never to the container at all.

`dsh` resolves `DEEPSEEK_API_KEY` through its own credential provider, which layers the inherited process environment (read-only, wins) over the managed `/data/dsh/.credentials.yaml` that its Models page writes. So the two ways to supply a key do not fight: when **Set DeepSeek API Key** holds one, the package injects it and the Models page shows it as read-only; when no key is stored the variable is not set at all, and the Models page owns the credential. That is also the answer to "why can't I change the key in the app" — clear it with the action first.

## Dependencies

None.

## Network Access and Interfaces

One interface, serving the agent's browser UI behind an authentication gate.

| Interface     | Id      | Type | Port | Description                      |
| ------------- | ------- | ---- | ---- | -------------------------------- |
| Web Interface | `webui` | ui   | 4201 | The DeepSeek Harness browser app |

The port is bound on the `webui` MultiHost and is not masked.

**Authentication is enforced by the OS reverse proxy, not by the service.** `dsh` has no login of its own — its webserver takes a host and a port and nothing else — so the binding sets `addSsl.auth` to HTTP basic with username `admin` and the password from `store.json`. Requests that fail the check get `401` at the edge and never reach the container. The credential is read reactively in `setupInterfaces`, so **Set Web Interface Password** takes effect without a restart.

That gate covers the TLS addresses only. A binding's plaintext port is a direct forward with no listener of StartOS's in front of it, so if a user enables the plain-HTTP address they reach the agent unauthenticated. Prefer the HTTPS address, and treat enabling the other one as publishing an open shell.

Port 4201 is a relay, not the application. `dsh web` accepts only `127.0.0.1` or `0.0.0.0` as a bind address and hard-refuses the latter, and the OS proxy dials the container's bridge address — so `agent/web-proxy.js` listens on 4201 and forwards to loopback, passing headers through untouched (WebSocket upgrades and SSE streams included, which is what makes replies render as they arrive).

Headers pass through because `dsh` fences its own `/api` routes on the `Host` header, and the daemon is launched with a `--trusted-host` for every authority this interface answers to, read from `sdk.host.getOwn` and refreshed when the user enables or disables an address. Rewriting `Host` to the loopback authority would also work and would need no such wiring — but it defeats the fence, which is the package's second line of defence against a hostile page in the user's browser reaching the agent.

Outbound, the health check reaches `api.deepseek.com` only. The agent itself is not so bounded: `dsh` ships a web-fetch tool and an MCP client, so a conversation can send it anywhere the container can reach.

## Installation and First-Run Flow

Set a password, set a key, open the interface. There is no upstream setup wizard and no account to create.

Installing raises two tasks. **Set Web Interface Password** is `critical`, so the service will not start until it has run — without a stored password the proxy would have no credential to enforce, and the agent's shell would be open to anyone who could reach the address. **Set DeepSeek API Key** is `important` and does not block: the service runs without an API key, the interface is reachable, and the DeepSeek API check simply reports that there is no key. That asymmetry is deliberate — a user who would rather paste their key into the interface's own Models page can, and a second critical task would have hidden the interface they need in order to do it.

## Actions

Two actions, and between them the whole of the service's configuration.

### Set Web Interface Password

Generates the credential the OS reverse proxy checks. Username is always `admin`.

- **When to run it** — at install, when the critical task demands it, and again to rotate.
- **What it changes** — `uiPassword` in `/data/store.json`.
- **Cost** — instant, and no restart: `setupInterfaces` re-reads the value and the proxy picks it up.
- **Repeat safety** — safe, but not idempotent. Each run mints a new password and the previous one stops working immediately.
- **Outputs** — the username and the password, the password masked and copyable. It is not recoverable afterwards; rotating is the only remedy for a lost one.

### Set DeepSeek API Key

Stores the DeepSeek API key. It is the action's only field — the model the agent uses is chosen in the web interface, not here.

- **When to run it** — at install, and again to rotate a key.
- **What it changes** — `apiKey` in `/data/store.json`.
- **Cost** — instant, but the key is a daemon environment variable, so it restarts the service and interrupts an in-flight conversation.
- **Repeat safety** — idempotent; re-running with the same values is a no-op restart.
- **What happens next** — the DeepSeek API check re-runs and reports whether DeepSeek accepted the key.

## Tasks

Two, both raised at install.

| Task                         | Severity    | Raised by                       | Cleared by         |
| ---------------------------- | ----------- | ------------------------------- | ------------------ |
| `Set Web Interface Password` | `critical`  | No `uiPassword` in `store.json` | Running the action |
| `Set DeepSeek API Key`       | `important` | Installing the package          | Running the action |

The password task re-arms whenever the stored password is absent, so it also covers a restore from a backup taken before one was set; it blocks startup while it stands, which suspends the service's ordinary controls. The API-key task is raised on the install init only and does not come back if the key is later removed — the DeepSeek API health check is the ongoing indicator for that.

## Health Checks

Two: one on the daemon, one standing alone.

| Check          | Displayed       | Probes                                                                              |
| -------------- | --------------- | ----------------------------------------------------------------------------------- |
| `webui`        | "Web Interface" | The relay on 4201, treating its own `502` as not-ready                              |
| `deepseek-api` | "DeepSeek API"  | `GET /user/balance` on `api.deepseek.com`, every five minutes, from the SDK runtime |

`deepseek-api` is a standalone check rather than a daemon because that is all it ever was — nothing consumes its result but the user. It probes `/user/balance`, which authenticates without naming a model and without spending tokens, and carries the diagnosis: no key set (run Set DeepSeek API Key), key accepted, account out of credit (top up and it recovers unattended), unreachable, or whatever else the API returned, quoted from the error body. Only an explicit `is_available: false` is read as out-of-credit — any other `200` body means the key authenticated, which is the question being asked. A failure here means the agent cannot answer; the interface will still load. It has no grace period — nothing is booting, so the first verdict is the true one — and it re-probes only every five minutes, so a key fixed by the action is reflected by the restart rather than by the next poll.

**Web Interface** failing past its two-minute grace period means `dsh` did not come up — the relay answers on 4201 either way, which is why a bare port check would be green while the UI was broken. Read the `webui` subcontainer's logs.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. Nothing is excluded, so the backup contains the workspace, every stored conversation, `dsh`'s own settings and credential file, and the API key in `store.json`. Treat the backup as carrying the key.

A restored instance is immediately usable: the key comes back with it, and there is no external state to resync.

## Limitations and Differences

1. **Authentication is at the edge, and only on the TLS addresses.** Upstream has no login at all; the OS reverse proxy supplies one. A binding's plaintext port bypasses that gate by design — it is a direct forward with no listener in front — so enabling the plain-HTTP address exposes the agent, and its shell, to anyone who can reach it.
2. **The agent's shell is confined to the container, not to the workspace.** `bubblewrap` and `landlock-run` are present and probe as fully functional, but the container is the boundary — all of `/data`, including the API key and every stored conversation, is reachable from a command the agent runs.
3. **Pinning the image does not pin the agent.** Upstream ships prereleases whose own dependencies are caret ranges, so rebuilding this repository unchanged can produce an image with different agent internals.

---

## Quick Reference for AI Consumers

```yaml
package_id: deepseek-harness
image: built from ./Dockerfile
architectures:
  - x86_64
  - aarch64
subcontainers:
  - webui # dsh web + agent/web-proxy.js
volumes:
  main: /data
file_models:
  - /data/store.json
startos_managed_env_vars:
  - DEEPSEEK_API_KEY
  - DSH_TRUSTED_HOSTS
dependencies: []
interfaces:
  webui: { type: ui, port: 4201 }
actions:
  - set-password
  - set-api-key
tasks:
  - { action: set-password, severity: critical }
  - { action: set-api-key, severity: important }
health_checks:
  - webui # displayed "Web Interface"
  - deepseek-api # displayed "DeepSeek API"
```
