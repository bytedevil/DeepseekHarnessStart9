FROM node:22-slim

# Python for the native-API agent harness
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# DeepSeek Harness CLI (provides the `dsh web` browser UI)
RUN npm install -g @deepseek-ai/dsh@0.1.1-rc.1

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
