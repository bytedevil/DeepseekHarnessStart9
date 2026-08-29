# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **`dsh` is published only as npm prereleases, and its dependency ranges are carets on those
  prereleases.** Pinning `@deepseek-ai/dsh` in the `Dockerfile` therefore fixes the CLI shim but not
  its tree — two builds of the same pin can ship different agent internals. Treat an unexplained
  behavior change after a rebuild as an upstream drift, not a package regression.
- **The two platform binaries are installed by hand because `npm install -g` drops
  `optionalDependencies`.** Their versions are read out of each parent package's own
  `optionalDependencies` at build time — don't replace that with a hardcoded version, or a `dsh` bump
  will silently pair the wrong binary with the resolver that looks for it.
- **`dsh web` takes only `127.0.0.1` or `0.0.0.0` as a bind address and hard-refuses the second**, so
  `agent/web-proxy.js` is the only reason the OS proxy — which dials the container's bridge address —
  can reach it at all. Keep the relay header-transparent: `dsh` fences its `/api` routes on `Host`,
  and `main.ts` feeds it a `--trusted-host` per authority from `sdk.host.getOwn`. Rewriting `Host` to
  the loopback authority also "works", and silently disables that fence.
- **A missed authority shows up as HTTP 403 on `/api`, not as a connection error** — the page loads
  and the app is inert. Check the `--trusted-host` list in the daemon's startup log first.
- **`dsh` has no authentication of any kind**; the gate is `addSsl.auth` on the binding in
  `interfaces.ts`, enforced by the OS reverse proxy. It covers the TLS addresses only — a plaintext
  binding is a direct forward — so never widen the exposure without accounting for that.
