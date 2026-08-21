# DeepSeek Harness

An always-on AI agent for StartOS, powered by the **native DeepSeek API** — plus the official **DeepSeek Harness web interface** running right on your server.

## What you get on StartOS

- A background agent service talking directly to api.deepseek.com (health-checked every 30 s)
- The **DeepSeek Web UI** browser interface (`dsh web`) under the service's Interfaces tab
- An **Open Web UI** button in Actions that hands you a clickable link
- A **Configure** action for your API key and model

## Getting set up

1. Get an API key at [platform.deepseek.com](https://platform.deepseek.com/) → **API Keys**
2. Open the service's **Config**/**Configure** action and paste your key (`sk-...`)
3. Wait ~30 seconds — the health check turns green when the key is verified
4. Click **Open Web UI**, or open the **DeepSeek Web UI** interface, to use the browser app

## Documentation

- DeepSeek API docs: https://api-docs.deepseek.com/
- dsh web CLI: https://www.npmjs.com/package/@deepseek-ai/dsh
- This package: https://github.com/bytedevil/DeepseekHarnessStart9
