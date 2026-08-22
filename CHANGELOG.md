# Changelog

All notable changes to the **DeepSeek Harness** StartOS package are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow
[ExVer](https://github.com/Start9Labs/start-os/blob/master/shared-libs/crates/start-core/src/s9pk/v2/manifest.rs)
(`X.Y.Z:N` — package version : spec version).

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

[0.0.2]: https://github.com/bytedevil/DeepseekHarnessStart9/releases/tag/v0.0.2
[0.0.1]: https://github.com/bytedevil/DeepseekHarnessStart9/releases/tag/v0.0.1
