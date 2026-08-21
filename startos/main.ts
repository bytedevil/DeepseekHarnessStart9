import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { uiPort, webPort, proxyPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting DeepSeek Harness — native DeepSeek API agent'))

  // Reactive read: changing the API key or model restarts the daemons.
  const store = (await storeJson.read().const(effects)) ?? {
    apiKey: '',
    model: 'deepseek-chat',
    pollSeconds: 30,
  }

  return sdk.Daemons.of(effects)
    .addDaemon('harness', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'main' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: false,
        }),
        'harness',
      ),
      exec: {
        command: ['python3', '/app/harness.py'],
        env: {
          DEEPSEEK_API_KEY: store.apiKey ?? '',
          DEEPSEEK_MODEL: store.model || 'deepseek-chat',
          HARNESS_POLL_SECONDS: String(store.pollSeconds ?? 30),
          HARNESS_HEALTH_PORT: String(uiPort),
        },
      },
      ready: {
        display: i18n('DeepSeek Harness Agent'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The DeepSeek Harness agent is running'),
            errorMessage: i18n('The DeepSeek Harness agent is not responding'),
          }),
      },
      requires: [],
    })
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
      // dsh web binds 127.0.0.1 only (upstream refuses 0.0.0.0 for safety).
      // webui-entrypoint runs dsh web + the TCP forwarder that exposes it
      // to StartOS on proxyPort.
      exec: {
        command: ['/app/webui-entrypoint.sh'],
        env: {
          PROXY_PORT: String(proxyPort),
          DSH_WEB_PORT: String(webPort),
          // dsh resolves the DeepSeek credential from the inherited
          // environment first (DEEPSEEK_API_KEY), then the managed
          // $DSH_HOME/.credentials.yaml (written by the web Models page).
          DEEPSEEK_API_KEY: store.apiKey ?? '',
          DEEPSEEK_MODEL: store.model || 'deepseek-chat',
          DSH_HOME: '/data/dsh',
        },
      },
      ready: {
        display: i18n('DeepSeek Web UI'),
        // Cooldown: dsh takes several seconds to boot; don't hammer it
        // every second while pending.
        trigger: sdk.trigger.cooldownTrigger(10_000),
        fn: () =>
          sdk.healthCheck.checkWebUrl(effects, `http://localhost:${proxyPort}/`, {
            successMessage: i18n('The DeepSeek web interface is ready'),
            errorMessage: i18n('The DeepSeek web interface is not responding yet'),
          }),
      },
      requires: ['harness'],
    })
})
