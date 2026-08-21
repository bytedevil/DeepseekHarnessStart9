// Minimal TCP forwarder: 0.0.0.0:$PROXY_PORT -> 127.0.0.1:$TARGET_PORT
//
// dsh web refuses to bind 0.0.0.0 (its API exposes agent tool execution,
// so direct LAN exposure is blocked by upstream design). StartOS exports
// service interfaces by connecting to the container's address, so we put
// this dumb byte-pipe in front: StartOS -> :4201 (this process) ->
// 127.0.0.1:4200 (dsh web). Raw TCP pipe — HTTP(S) passes through untouched.

const net = require('node:net')

const PROXY_PORT = Number(process.env.PROXY_PORT || 4201)
const TARGET_PORT = Number(process.env.TARGET_PORT || 4200)
const TARGET_HOST = '127.0.0.1'

const server = net.createServer((client) => {
  const upstream = net.connect(TARGET_PORT, TARGET_HOST)
  client.pipe(upstream)
  upstream.pipe(client)

  const cleanup = () => {
    client.destroy()
    upstream.destroy()
  }
  client.on('error', cleanup)
  upstream.on('error', cleanup)
  client.on('close', cleanup)
  upstream.on('close', cleanup)
})

server.on('error', (err) => {
  console.error(`[web-proxy] server error: ${err.message}`)
  process.exit(1)
})

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(
    `[web-proxy] forwarding 0.0.0.0:${PROXY_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`,
  )
})
