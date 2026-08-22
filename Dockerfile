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
ARG TARGETARCH=amd64
RUN set -eux; \
    npm install -g @deepseek-ai/dsh@0.1.1-rc.1; \
    GLOBAL_ROOT="$(npm root -g)/@deepseek-ai/dsh/node_modules"; \
    # npm omits optionalDependencies for global installs, and 'npm install
    # --prefix' nests the payload under an extra node_modules/ level, which
    # is the wrong place for dsh's runtime resolution. Download each
    # platform binary's tarball and unpack it directly into the exact path
    # dsh expects ($GLOBAL_ROOT/<name>/bin/...). Static prebuilts for both
    # arches are carried so one image serves both StartOS targets.
    TMP="$(mktemp -d)"; \
    for spec in \
      "@deepseek-ai/node-addon-landlock-run-linux-x64@0.1.1" \
      "@deepseek-ai/node-addon-landlock-run-linux-arm64@0.1.1" \
      "@vscode/ripgrep-linux-x64@1.18.0" \
      "@vscode/ripgrep-linux-arm64@1.18.0" \
    ; do \
      name="${spec%@*}"; \
      url="$(npm view "$spec" dist.tarball)"; \
      echo "fetching $spec from $url"; \
      mkdir -p "$TMP/out"; \
      tgz="$(npm pack "$url" --pack-destination "$TMP" --silent)"; \
      tar -xzf "$TMP/$tgz" -C "$TMP/out"; \
      mkdir -p "$GLOBAL_ROOT/$name"; \
      cp -r "$TMP/out/package/." "$GLOBAL_ROOT/$name/"; \
      rm -rf "$TMP/out"; \
    done; \
    rm -rf "$TMP"; \
    chmod 755 "$GLOBAL_ROOT"/@deepseek-ai/node-addon-landlock-run-linux-*/bin/landlock-run \
              "$GLOBAL_ROOT"/@vscode/ripgrep-linux-*/bin/rg; \
    # TARGETARCH is amd64/arm64 (Docker); the npm packages use x64/arm64.
    case "$TARGETARCH" in \
      amd64) PKGARCH=x64 ;; \
      arm64) PKGARCH=arm64 ;; \
      *) echo "unsupported TARGETARCH: $TARGETARCH"; exit 1 ;; \
    esac; \
    test -x "$GLOBAL_ROOT/@deepseek-ai/node-addon-landlock-run-linux-${PKGARCH}/bin/landlock-run"; \
    test -x "$GLOBAL_ROOT/@vscode/ripgrep-linux-${PKGARCH}/bin/rg"

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
