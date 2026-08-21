import { i18n } from './i18n'
import { sdk } from './sdk'
import { proxyPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Web UI: dsh web (loopback) -> web-proxy TCP forwarder on proxyPort
  const multi = sdk.MultiHost.of(effects, 'webui')
  const origin = await multi.bindPort(proxyPort, {
    protocol: 'http',
    preferredExternalPort: proxyPort,
  })

  const ui = sdk.createInterface(effects, {
    name: i18n('DeepSeek Web UI'),
    id: 'webui',
    description: i18n('The DeepSeek Harness browser interface (dsh web)'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await origin.export([ui])]
})
