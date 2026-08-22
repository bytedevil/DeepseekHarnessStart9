// HTTP + WebSocket reverse proxy: 0.0.0.0:$PROXY_PORT -> 127.0.0.1:$TARGET_PORT
//
// dsh web binds loopback only (upstream refuses 0.0.0.0) and its
// browser-trust fence validates the Host header. StartOS exposes the
// service on a RANDOM external port under names like node.local, so the
// safest fix is to rewrite Host (and Referer/Origin) to the loopback
// authority dsh natively trusts, then forward over plain HTTP.

const http = require('node:http')
const net = require('node:net')

const PROXY_PORT = Number(process.env.PROXY_PORT || 4201)
const TARGET_HOST = '127.0.0.1'
const TARGET_PORT = Number(process.env.TARGET_PORT || 4200)
const TARGET_AUTHORITY = `${TARGET_HOST}:${TARGET_PORT}`

function scrubHeaders(headers) {
  const out = { ...headers }
  if (out.host !== undefined) out.host = TARGET_AUTHORITY
  if (out.referer !== undefined && out.referer.includes('://')) {
    try {
      const u = new URL(out.referer)
      out.referer = `http://${TARGET_AUTHORITY}${u.pathname}${u.search}`
    } catch {}
  }
  if (out.origin !== undefined) out.origin = `http://${TARGET_AUTHORITY}`
  return out
}

const server = http.createServer((req, res) => {
  const upstreamReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: scrubHeaders(req.headers),
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers)
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

// WebSocket upgrades: splice the raw sockets, rewriting the handshake's
// Host/Origin lines before they reach dsh.
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(TARGET_PORT, TARGET_HOST)
  let buffered = Buffer.alloc(0)
  let sent = false

  upstream.on('connect', () => {
    // Nothing to do here; we forward once we have the full header block.
  })

  socket.on('data', function onData(chunk) {
    if (sent) {
      upstream.write(chunk)
      return
    }
    buffered = Buffer.concat([buffered, chunk])
    const idx = buffered.indexOf('\r\n\r\n')
    if (idx === -1) return // wait for full handshake

    let text = buffered.subarray(0, idx).toString('latin1')
    text = text.replace(/^Host:.*$/im, `Host: ${TARGET_AUTHORITY}`)
    text = text.replace(/^Origin:.*$/im, `Origin: http://${TARGET_AUTHORITY}`)
    const rest = buffered.subarray(idx + 4)

    upstream.write(text + '\r\n\r\n')
    if (rest.length > 0) upstream.write(rest)
    sent = true
    socket.removeListener('data', onData)

    upstream.pipe(socket)
    socket.pipe(upstream)
    if (head && head.length > 0) upstream.write(head)
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

server.on('error', (err) => {
  console.error(`[web-proxy] server error: ${err.message}`)
  process.exit(1)
})

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(
    `[web-proxy] http+ws 0.0.0.0:${PROXY_PORT} -> ${TARGET_AUTHORITY} (Host rewritten)`,
  )
})
