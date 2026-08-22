// HTTP + WebSocket reverse proxy: 0.0.0.0:$PROXY_PORT -> 127.0.0.1:$TARGET_PORT
//
// dsh web binds loopback only (upstream refuses 0.0.0.0) and its
// browser-trust fence validates the Host header. StartOS exposes the
// service on a RANDOM external port under names like node.local, so we
// rewrite Host/Origin/Referer to the loopback authority dsh natively
// trusts, then forward.
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
const TARGET_AUTHORITY = `${TARGET_HOST}:${TARGET_PORT}`

function scrubRequestHeaders(headers) {
  const out = {}
  for (const [key, value] of Object.entries(headers)) {
    const k = key.toLowerCase()
    if (k === 'host') out[key] = TARGET_AUTHORITY
    else if (k === 'origin') out[key] = `http://${TARGET_AUTHORITY}`
    else if (k === 'referer' && typeof value === 'string' && value.includes('://')) {
      try {
        const u = new URL(value)
        out[key] = `http://${TARGET_AUTHORITY}${u.pathname}${u.search}`
      } catch {
        out[key] = value
      }
    } else out[key] = value
  }
  return out
}

const server = http.createServer((req, res) => {
  res.socket?.setNoDelay(true)

  const upstreamReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: scrubRequestHeaders(req.headers),
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

// WebSocket upgrades: replay Node's parsed (and scrubbed) headers to the
// upstream, forward the pre-parsed body chunk, then splice both pipes.
server.on('upgrade', (req, socket, head) => {
  socket.setNoDelay(true)
  const upstream = net.connect(TARGET_PORT, TARGET_HOST)
  upstream.setNoDelay(true)

  upstream.on('connect', () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`]
    const scrubbed = scrubRequestHeaders(req.headers)
    for (const [key, value] of Object.entries(scrubbed)) {
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
  console.log(
    `[web-proxy] http+ws 0.0.0.0:${PROXY_PORT} -> ${TARGET_AUTHORITY} (Host rewritten, timeouts off)`,
  )
})
