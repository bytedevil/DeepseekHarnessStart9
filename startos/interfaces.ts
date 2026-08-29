import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { proxyPort, uiUsername, webuiHostId, webuiInterfaceId } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // dsh ships no authentication at all, so the StartOS reverse proxy gates the
  // port with HTTP basic auth. Read reactively so the gate follows the
  // credential the moment set-password writes it.
  const password = await storeJson.read((s) => s?.uiPassword).const(effects)

  const multi = sdk.MultiHost.of(effects, webuiHostId)
  const origin = await multi.bindPort(proxyPort, {
    protocol: 'http',
    preferredExternalPort: proxyPort,
    addSsl: password
      ? {
          auth: {
            type: 'basic',
            credentials: [{ username: uiUsername, password }],
            realm: null,
          },
        }
      : undefined,
  })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web Interface'),
    id: webuiInterfaceId,
    description: i18n(
      'The DeepSeek Harness agent — chat, workspace files, and its shell',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    // Leave null even though the gate has a username: the SDK folds it into the
    // address as `admin@<host>`, and Chromium refuses userinfo in top-level
    // navigations. The gate still prompts for it.
    username: null,
    path: '',
    query: {},
  })

  return [await origin.export([ui])]
})
