# Changelog

All notable changes to the **DeepSeek Harness** StartOS package are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow
[ExVer](https://github.com/Start9Labs/start-os/blob/master/shared-libs/crates/start-core/src/s9pk/v2/manifest.rs)
(`X.Y.Z:N` — package version : spec version).

## [0.0.4] — 2026-08-22

### Added
- **System Administration action** (Settings panel): sign in to your own
  StartOS server with the master password (`start-cli auth login`) and
  administer the whole server — install/update packages, change system
  settings, manage hosts, SSH, backups — from this service. The password is
  passed only to that single command invocation (never written to disk,
  config files, or logs); the derived session key persists under
  `/data/startos-cli` on the service volume.

### Changed
- Author metadata: **Pau Font Martínez**, contact `contacte@pau.fm`,
  support site now points to the contact address; PayPal donation link
  updated to the account associated with `paufont@gmail.com`.

## [0.0.3] — 2026-08-22

### Fixed
- **Agent tools (bash / glob / grep) all failed inside the web UI**:
  `spawn .../landlock-run ENOENT` and "ripgrep launch failed". Root cause:
  `npm install -g` silently omits `optionalDependencies`, which is where dsh
  ships its platform binaries (`@deepseek-ai/node-addon-landlock-run-*` for
  the bash sandbox, `@vscode/ripgrep-*` for search). The image now unpacks
  both prebuilt binaries (x64 + arm64) directly into dsh's module tree at
  the exact paths its runtime resolver expects, verified at build time.
- Added `bubblewrap` — the first rung of dsh's Linux sandbox provider chain,
  preferred over landlock when present.

### Changed
- CI: `start-cli` fetched as a pinned release asset with the workflow token
  (the public installer hit GitHub API rate limits, HTTP 403).

## [0.0.2] — 2026-08-22

### Fixed
- **Realtime chat**: messages now stream live. The reverse proxy's WebSocket
  upgrade used raw-buffer surgery that broke silently; upgrades now replay
  Node's parsed headers, and Node's default `requestTimeout` (300 s) no longer
  kills long-lived streams (`requestTimeout = 0`, SSE flushed with
  `flushHeaders()`).
- **HTTP 403 on `/api/host.listDirectory`** ("Select Workspace Directory" was
  empty): `dsh web`'s browser-trust fence rejects hostname `Host:` headers,
  and StartOS exposes the service on a random external port, so port-based
  whitelisting could never match. The proxy now rewrites `Host`, `Origin` and
  `Referer` to `127.0.0.1:4200`, which dsh natively trusts; bare-hostname
  `--trusted-host` entries remain as defense in depth.

### Added
- Projects workspace: the web UI is rooted at `/data/projects` on the
  persistent volume (`mkdir -p`, mode 775) so project folders created from the
  UI survive updates and are included in backups.
- Package logo: flat whale mark in DeepSeek blue over a deep-navy gradient,
  verified legible down to ~32 px (1.6 KB SVG).
- Author credit and PayPal donation link in the manifest.

### Changed
- Release hygiene: repository history squashed to a single commit; all
  pre-release tags removed; this is the first tagged release line.

## [0.0.1] — 2026-08-21

### Added
- Initial public release.
- Native DeepSeek API agent (`agent/harness.py`) calling
  `https://api.deepseek.com/chat/completions` directly — unmodified upstream
  API, no proxies or gateways for model traffic. Health endpoint on :8080
  verifies the configured key with real completions every cycle.
- Official DeepSeek Harness web UI (`@deepseek-ai/dsh`) served on loopback and
  exposed through a TCP/HTTP forwarder on :4201, because upstream refuses to
  bind `0.0.0.0` by design (its API can execute agent tools).
- StartOS integration: two daemons (`harness`, `webui`), exported `ui`
  interface, "Configure" action (API key + model stored server-side),
  "Open Web UI" action resolving the interface URL via `sdk.host.getOwn`,
  reactive restarts on config change, health-check cooldown, i18n ×5.
- CI (GitHub Actions): universal `.s9pk` builds (x86_64 + aarch64) on push and
  tag releases using buildx docker-container driver per Start9's own recipe.

[0.0.4]: https://github.com/bytedevil/DeepseekHarnessStart9/releases/tag/v0.0.4
[0.0.3]: https://github.com/bytedevil/DeepseekHarnessStart9/releases/tag/v0.0.3
[0.0.2]: https://github.com/bytedevil/DeepseekHarnessStart9/releases/tag/v0.0.2
[0.0.1]: https://github.com/bytedevil/DeepseekHarnessStart9/releases/tag/v0.0.1
