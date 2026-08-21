# DeepSeek Harness for StartOS

An always-on AI agent service package for **StartOS**, powered by the **native DeepSeek API** (`api.deepseek.com`) — unmodified, no proxies, no third-party gateways. Your API key never leaves your server.

Includes the official **DeepSeek Harness web interface** (`dsh web` from `@deepseek-ai/dsh`) served as a StartOS UI, with an **Open Web UI** action button.

## What it does

- **Agent daemon**: background service talking directly to the official DeepSeek API; verifies your key with a real completion every 30 s
- **Web UI daemon**: boots `dsh web` (the browser app) inside the same container
- **Interfaces tab**: "DeepSeek Web UI" — open it like any other StartOS service UI
- **Actions**:
  - *Configure* — set your API key (`sk-...`) and model
  - *Open Web UI* — returns a clickable link to the browser interface
- Persistent state in the `main` volume: agent state at `/data/state.json`, dsh profile home at `/data/dsh`

## Install (sideload)

1. Download `deepseek-harness.s9pk` from [Releases](https://github.com/bytedevil/DeepseekHarnessStart9/releases)
2. In StartOS: **System → Sideload Service**
3. Open the service → **Configure** → paste your DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com/))
4. Click **Open Web UI** (or open the **Interfaces** tab) to launch the browser interface

## Building from source

Requires Docker with buildx (docker-container driver), Node 22+, make, git, jq, and [start-cli](https://start9.com/start-cli/install.sh):

```bash
git clone https://github.com/bytedevil/DeepseekHarnessStart9.git
cd DeepseekHarnessStart9
# inside a StartOS packaging workspace (start-cli s9pk init-workspace):
make universal   # builds deepseek-harness.s9pk (x86_64 + aarch64)
```

CI builds every push and attaches the `.s9pk` to every `v*` tag release — see `.github/workflows/build.yml`.

## Architecture

```
agent/harness.py        # Python agent: native DeepSeek API client + health endpoint :8080
agent/entrypoint.sh     # starts the agent + execs `dsh web` in the foreground
Dockerfile              # node:22-slim + python3 + @deepseek-ai/dsh (global)
startos/main.ts         # two daemons: harness (python3) + webui (entrypoint.sh)
startos/interfaces.ts   # exports the web UI on port 4200 as a StartOS interface
startos/actions/        # Configure (key/model), Open Web UI (launcher button)
startos/fileModels/     # store.json persistence (API key lives on YOUR server)
```

The agent calls `POST https://api.deepseek.com/chat/completions` with zero middleware. The web UI is the unmodified upstream `@deepseek-ai/dsh` package run as `dsh web`.

## License

MIT
