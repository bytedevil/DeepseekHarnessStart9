import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { dshPort, proxyPort, webuiHostId, webuiInterfaceId } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting DeepSeek Harness'))

  const store = await storeJson.read().const(effects)

  // dsh fences its /api routes on the Host header. It cannot know the address
  // the user enabled, so hand it every hostname this interface answers to and
  // let the fence do its job; the daemon restarts when that set changes.
  const trustedHosts = await sdk.host
    .getOwn(effects, webuiHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === webuiInterfaceId)
      return iface
        ? [...new Set(iface.addressInfo.hostnames.map((h) => h.hostname))]
        : []
    })
    .const()

  return sdk.Daemons.of(effects)
    .addDaemon('webui', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'main' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: false,
        }),
        'webui',
      ),
      exec: {
        command: ['/app/webui-entrypoint.sh'],
        env: {
          PROXY_PORT: String(proxyPort),
          DSH_WEB_PORT: String(dshPort),
          DSH_TRUSTED_HOSTS: trustedHosts
            .map((h) => (h.includes(':') ? `[${h}]` : h))
            .join(' '),
          // Omitted rather than blank: dsh treats the inherited environment as
          // read-only and wins, so a set key locks its Models page to it.
          ...(store?.apiKey ? { DEEPSEEK_API_KEY: store.apiKey } : {}),
          DSH_HOME: '/data/dsh',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 120_000,
        trigger: sdk.trigger.cooldownTrigger(10_000),
        fn: async () => {
          // web-proxy answers 502 while dsh is still booting.
          const res = await fetch(`http://localhost:${proxyPort}/`).catch(
            () => null,
          )
          return !res || res.status === 502
            ? {
                result: 'failure',
                message: i18n('The web interface is not responding yet'),
              }
            : {
                result: 'success',
                message: i18n('The web interface is ready'),
              }
        },
      },
      requires: [],
    })
    .addHealthCheck('deepseek-api', {
      ready: {
        display: i18n('DeepSeek API'),
        // Nothing here is booting, so a failure is true the moment it happens.
        gracePeriod: 0,
        // Every poll is a billed request, so probe once promptly and then rarely.
        trigger: sdk.trigger.statusTrigger(300_000, { starting: 1_000 }),
        fn: async () => {
          if (!store?.apiKey)
            return {
              result: 'failure',
              message: i18n(
                'No API key set. Run the Set DeepSeek API Key action, or add one from the web interface.',
              ),
            }
          // /user/balance authenticates and reports credit without naming a
          // model or spending tokens.
          const res = await fetch('https://api.deepseek.com/user/balance', {
            headers: { authorization: `Bearer ${store.apiKey}` },
            signal: AbortSignal.timeout(30_000),
          }).catch(() => null)

          if (!res)
            return {
              result: 'failure',
              message: i18n('Could not reach api.deepseek.com'),
            }
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
              error?: { message?: string }
            } | null
            return {
              result: 'failure',
              message: i18n(
                'The DeepSeek API rejected the request: ${detail}',
                {
                  detail: body?.error?.message ?? String(res.status),
                },
              ),
            }
          }
          // Only an explicit false is a verdict; an unrecognised body still had
          // to authenticate to reach 200.
          const balance = (await res.json().catch(() => null)) as {
            is_available?: boolean
          } | null
          return balance?.is_available === false
            ? {
                result: 'failure',
                message: i18n(
                  'Your DeepSeek account is out of credit. Top it up at platform.deepseek.com and the agent recovers on its own.',
                ),
              }
            : {
                result: 'success',
                message: i18n('The DeepSeek API accepted your key'),
              }
        },
      },
      requires: [],
    })
})
