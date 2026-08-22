FROM node:22-slim

# Python for the native-API agent harness
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates bubblewrap \
    && rm -rf /var/lib/apt/lists/*

# DeepSeek Harness CLI (provides the `dsh web` browser UI).
#
# npm omits optionalDependencies for global installs (known npm behavior),
# which silently drops the platform binaries dsh needs:
#   - @deepseek-ai/node-addon-landlock-run-<arch> : the bash tool's
#     landlock sandbox launcher (spawn ENOENT without it)
#   - @vscode/ripgrep-<arch>                      : the glob/grep tools
#     ("ripgrep launch failed" without it)
# Install them explicitly into the same tree, matching dsh's versions.
RUN set -eux; \
    npm install -g @deepseek-ai/dsh@0.1.1-rc.1; \
    GLOBAL_ROOT="$(npm root -g)/@deepseek-ai/dsh/node_modules"; \
    mkdir -p "$GLOBAL_ROOT/@deepseek-ai" "$GLOBAL_ROOT/@vscode"; \
    # --force: these packages declare cpu/os fields, so installing the x64
    # binary on an arm64 builder (and vice versa) would fail EBADPLATFORM.
    # They are static prebuilt binaries; dsh resolves the right one at
    # runtime, so carrying both is harmless and keeps one Dockerfile.
    npm install --force --prefix "$GLOBAL_ROOT/@deepseek-ai/node-addon-landlock-run-linux-x64" @deepseek-ai/node-addon-landlock-run-linux-x64@0.1.1; \
    npm install --force --prefix "$GLOBAL_ROOT/@deepseek-ai/node-addon-landlock-run-linux-arm64" @deepseek-ai/node-addon-landlock-run-linux-arm64@0.1.1; \
    npm install --force --prefix "$GLOBAL_ROOT/@vscode/ripgrep-linux-x64" @vscode/ripgrep-linux-x64@1.18.0; \
    npm install --force --prefix "$GLOBAL_ROOT/@vscode/ripgrep-linux-arm64" @vscode/ripgrep-linux-arm64@1.18.0; \
    find "$GLOBAL_ROOT/@deepseek-ai/node-addon-landlock-run-linux-"*/bin "$GLOBAL_ROOT/@vscode/ripgrep-linux-"*/bin -type f -exec chmod 755 {} \;; \
    test -x "$(npm root -g)/@deepseek-ai/dsh/node_modules/@deepseek-ai/node-addon-landlock-run-linux-${TARGETARCH}/bin/landlock-run" || \
    test -x "$(npm root -g)/@deepseek-ai/dsh/node_modules/@deepseek-ai/node-addon-landlock-run-linux-x64/bin/landlock-run"

WORKDIR /app

COPY agent/requirements.txt /app/agent/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/agent/requirements.txt

COPY agent/harness.py /app/harness.py
COPY agent/web-proxy.js /app/web-proxy.js
COPY agent/webui-entrypoint.sh /app/webui-entrypoint.sh
RUN chmod +x /app/webui-entrypoint.sh

# The API key is injected by StartOS at runtime (never baked into the image).
ENV DEEPSEEK_API_KEY="" \
    DEEPSEEK_MODEL="deepseek-chat" \
    HARNESS_POLL_SECONDS="30" \
    HARNESS_STATE="/data/state.json" \
    DSH_HOME="/data/dsh" \
    HARNESS_HEALTH_PORT="8080"

CMD ["python3", "/app/harness.py"]
