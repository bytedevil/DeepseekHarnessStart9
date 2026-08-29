# DeepSeek Harness

The agent this service runs can execute shell commands in its own workspace on your server. Anyone
who can open its web interface and get past the password can make it do that — so decide where you
want the interface reachable before you start using it.

## Documentation

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — the upstream project's README,
  covering the agent, its tools, and its configuration.
- [DeepSeek API documentation](https://api-docs.deepseek.com/) — models, pricing, and how to create
  an API key.

## What you get on StartOS

- **The DeepSeek Harness web interface**, where you chat with the agent and watch it work.
- **A password on the front door.** The agent has no login of its own, so StartOS asks for one before
  any request reaches it.
- **A workspace on your server** at `/data/projects` — every project folder you create, plus the files
  the agent writes, kept on your own disk and included in your backups.
- **Your chat history**, also kept on the server and backed up.
- **A DeepSeek API health check** that watches your key and your remaining credit, so a revoked key
  or an empty account shows up on the service's dashboard rather than as a puzzling error
  mid-conversation.

Model requests go from your server straight to DeepSeek's official API. Nothing sits in between.

## Getting set up

1. Run **Set Web Interface Password**. The service will not start until you do. Save what it gives
   you — the password is not shown again, and the username is always `admin`.
2. Create an API key at [platform.deepseek.com](https://platform.deepseek.com/) and add credit to the
   account — DeepSeek's API is paid, and a key with no balance cannot answer.
3. Run **Set DeepSeek API Key** and paste the key.
4. Wait for the **DeepSeek API** health check to go green. That means DeepSeek accepted the key.
5. Open the **Web Interface**, enter `admin` and your password when the browser asks, and start a
   conversation.

## Using DeepSeek Harness

### Web interface

The agent works inside `/data/projects` on your server — that is where its project folders live, and
what your StartOS backup captures. Keep your work there; anything it writes elsewhere in the
container is lost when the service is rebuilt.

Conversations are saved too, so you can leave one and come back to it.

### Actions

- **Set Web Interface Password** — generates a new password for the interface. Run it to rotate;
  the old one stops working straight away, and the new one takes effect without a restart.
- **Set DeepSeek API Key** — stores the key, and does nothing else. Run it whenever you rotate your key; the
  service restarts so the change takes effect. While a key is set here it is the one the agent uses,
  and the interface's own Models page shows it as read-only — clear it here first if you would rather
  manage the key in the app. Which model the agent uses is always chosen in the app.

## Limitations

- **Choose the HTTPS address.** The password is checked by StartOS on the encrypted addresses. If you
  enable the plain `http://` one instead, requests reach the agent without being asked for anything —
  which on this service means an open shell on your server.
- **You pay DeepSeek per request.** The agent can use a lot of tokens on a single task. Watch the
  **DeepSeek API** health check — it turns red when your account runs out of credit.
