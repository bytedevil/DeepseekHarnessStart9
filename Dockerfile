FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates bubblewrap \
    && rm -rf /var/lib/apt/lists/*

# `npm install -g` drops optionalDependencies, which is where dsh's two
# platform binaries live: landlock-run (the bash tool's sandbox launcher) and
# ripgrep (the glob/grep tools). Unpack each one's tarball into the path dsh's
# resolver expects, at the version its own parent package asks for.
ARG TARGETARCH=amd64
RUN set -eux; \
    npm install -g @deepseek-ai/dsh@0.1.1-rc.2; \
    GLOBAL_ROOT="$(npm root -g)/@deepseek-ai/dsh/node_modules"; \
    case "$TARGETARCH" in \
      amd64) PKGARCH=x64 ;; \
      arm64) PKGARCH=arm64 ;; \
      *) echo "unsupported TARGETARCH: $TARGETARCH"; exit 1 ;; \
    esac; \
    TMP="$(mktemp -d)"; \
    for parent in @deepseek-ai/node-addon-landlock-run @vscode/ripgrep; do \
      name="${parent}-linux-${PKGARCH}"; \
      version="$(node -p "require('$GLOBAL_ROOT/$parent/package.json').optionalDependencies['$name']")"; \
      tgz="$(npm pack "${name}@${version}" --pack-destination "$TMP" --silent)"; \
      tar -xzf "$TMP/$tgz" -C "$TMP"; \
      mkdir -p "$GLOBAL_ROOT/$name"; \
      cp -r "$TMP/package/." "$GLOBAL_ROOT/$name/"; \
      rm -rf "$TMP/package" "$TMP/$tgz"; \
    done; \
    rm -rf "$TMP"; \
    chmod 755 "$GLOBAL_ROOT/@deepseek-ai/node-addon-landlock-run-linux-${PKGARCH}/bin/landlock-run" \
              "$GLOBAL_ROOT/@vscode/ripgrep-linux-${PKGARCH}/bin/rg"; \
    test -x "$GLOBAL_ROOT/@deepseek-ai/node-addon-landlock-run-linux-${PKGARCH}/bin/landlock-run"; \
    test -x "$GLOBAL_ROOT/@vscode/ripgrep-linux-${PKGARCH}/bin/rg"

WORKDIR /app

COPY agent/web-proxy.js /app/web-proxy.js
COPY agent/webui-entrypoint.sh /app/webui-entrypoint.sh
RUN chmod +x /app/webui-entrypoint.sh

CMD ["/app/webui-entrypoint.sh"]
