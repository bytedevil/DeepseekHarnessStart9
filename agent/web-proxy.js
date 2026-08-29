// HTTP + WebSocket relay: 0.0.0.0:$PROXY_PORT -> 127.0.0.1:$TARGET_PORT
//
// dsh web binds loopback only, which the StartOS reverse proxy cannot reach —
// it dials the container's bridge address. This relay is the one hop between
// the two. Headers pass through untouched: dsh fences its own /api routes on
// the Host header, and the daemon is started with the authorities this
// interface actually answers to (DSH_TRUSTED_HOSTS).
//
// Realtime notes (the chat only renders live events over WS/SSE):
// - upgrades use Node's parsed headers (no raw-buffer surgery)
// - requestTimeout/headersTimeout are disabled so long-lived streams
//   are never killed mid-conversation

const http = require('node:http')
const net = require('node:net')

const PROXY_PORT = Number(process.env.PROXY_PORT || 4201)
const TARGET_HOST = '127.0.0.1'
const TARGET_PORT = Number(process.env.TARGET_PORT || 4200)

const server = http.createServer((req, res) => {
  res.socket?.setNoDelay(true)

  const upstreamReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers)
      res.flushHeaders() // don't buffer SSE/event-stream responses
      upstreamRes.pipe(res)
    },
  )
  upstreamReq.on('error', (err) => {
    console.error(`[web-proxy] upstream error: ${err.message}`)
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('web-proxy: upstream unavailable')
  })
  req.pipe(upstreamReq)
})

// WebSocket upgrades: replay Node's parsed headers to the upstream, forward the
// pre-parsed body chunk, then splice both pipes.
server.on('upgrade', (req, socket, head) => {
  socket.setNoDelay(true)
  const upstream = net.connect(TARGET_PORT, TARGET_HOST)
  upstream.setNoDelay(true)

  upstream.on('connect', () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`]
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) value.forEach((v) => lines.push(`${key}: ${v}`))
      else lines.push(`${key}: ${value}`)
    }
    upstream.write(lines.join('\r\n') + '\r\n\r\n')
    if (head && head.length > 0) upstream.write(head)

    socket.pipe(upstream)
    upstream.pipe(socket)
    socket.resume() // flush anything Node buffered past the handshake
  })

  const cleanup = () => {
    socket.destroy()
    upstream.destroy()
  }
  socket.on('error', cleanup)
  upstream.on('error', (err) => {
    console.error(`[web-proxy] ws upstream error: ${err.message}`)
    cleanup()
  })
  socket.on('close', cleanup)
  upstream.on('close', cleanup)
})

// Long-lived conversations must never be cut by Node's defaults.
server.requestTimeout = 0
server.headersTimeout = 60_000
server.keepAliveTimeout = 120_000

server.on('error', (err) => {
  console.error(`[web-proxy] server error: ${err.message}`)
  process.exit(1)
})

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[web-proxy] http+ws 0.0.0.0:${PROXY_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`)
})
