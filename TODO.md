# TODO: DeepSeek Harness (sideload s9pk)

- [x] Manifest: id, title, license, repos, descriptions (5 locales)
- [x] Image: node:22-slim + python3 + @deepseek-ai/dsh (native DeepSeek API)
- [x] Daemon harness: python3 agent with port health check (:8080)
- [x] Daemon webui: `dsh web --host 0.0.0.0 --no-open` on :4200
      (one daemon = one process; the old entrypoint double-started the
      agent and crashed with "Address already in use")
- [x] Interface: web UI exported as a StartOS service interface + Open Web UI action
- [x] Config: DEEPSEEK_API_KEY passed to BOTH daemons (dsh needs it too)
- [x] Health check cooldown (10s) so startup probes don't spam ECONNREFUSED
- [x] 402 Insufficient Balance reported once with clear remediation message
- [ ] Sideload test on StartOS 0.4.0.1 with a funded DeepSeek account
