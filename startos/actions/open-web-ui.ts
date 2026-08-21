import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { proxyPort } from '../utils'

/**
 * "Open Web UI" — a button in the service's Actions tab that hands the user
 * a clickable link to the dsh web interface. The authoritative entry point
 * is always the service's Interfaces tab; this is a convenience shortcut.
 */
export const openWebUi = sdk.Action.withoutInput(
  'open-web-ui',
  async () => ({
    name: i18n('Open Web UI'),
    description: i18n(
      'Get a clickable link to the DeepSeek Harness browser interface (dsh web). Also available under Interfaces.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),
  // Handler
  async ({ effects }) => {
    // Walk the exported host to the webui interface's address info, which
    // comes pre-filled with URL helpers for every enabled address.
    const host = await sdk.host.getOwn(effects, 'webui').once()

    const addressInfo =
      host?.bindings?.[proxyPort]?.interfaces?.['webui']?.addressInfo ?? null

    // Prefer the first non-local URL (LAN/private domain); fall back to any.
    let url = ''
    if (addressInfo) {
      url = addressInfo.nonLocal.hostnames[0]
        ? addressInfo.toUrl(addressInfo.nonLocal.hostnames[0])
        : (addressInfo.format('urlstring')[0] ?? '')
    }

    if (!url) {
      throw new Error(
        i18n(
          'No address is enabled yet. Enable one under this service’s Interfaces tab, then try again.',
        ),
      )
    }

    return {
      version: '1',
      title: i18n('DeepSeek Web UI'),
      message: i18n('Click the link below to open the interface.'),
      result: {
        type: 'single',
        name: i18n('Web UI URL'),
        description: null,
        value: url,
        masked: false,
        copyable: true,
        qr: false,
      },
    }
  },
)
