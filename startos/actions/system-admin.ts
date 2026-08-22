import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

/**
 * "System Administration" — a Settings-panel action that signs the user in
 * to their own StartOS server through start-cli, so the whole server can be
 * administered from this service (install/update packages, change system
 * settings, manage hosts/SSH, etc.).
 *
 * The master password is collected here and used once by `start-cli auth
 * login` (passed as the PASSWORD environment variable of that single exec,
 * matching start-cli's own contract). It is never written to disk or logged.
 * The derived session key lives under /data/startos-cli on the persistent
 * volume, so the session survives restarts.
 */
const inputSpec = InputSpec.of({
  host: Value.text({
    name: i18n('Server address'),
    description: i18n(
      'The address you use to reach StartOS, e.g. node.local or 192.168.1.10',
    ),
    required: true,
    default: null,
    patterns: [],
  }),
  password: Value.text({
    name: i18n('StartOS master password'),
    description: i18n(
      'Used once to sign in; never stored on disk or included in logs.',
    ),
    required: true,
    default: null,
    masked: true,
    patterns: [],
  }),
})

export const systemAdmin = sdk.Action.withInput(
  'system-admin',
  {
    name: i18n('System Administration'),
    description: i18n(
      'Sign in to StartOS with the master password to administer the whole server from this panel.',
    ),
    warning: i18n(
      'Grants full control of your StartOS server. The password is used once for signing in and never saved.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  // No prefill — credentials are always entered fresh.
  async () => ({}),
  // Handler
  async ({ effects, input }) => {
    const host = input.host.trim().replace(/\/+$/, '')
    const target = host.startsWith('http') ? host : `https://${host}`

    const subcontainer = sdk.SubContainer.of(
      effects,
      { imageId: 'main' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: 'startos-cli',
        mountpoint: '/data/startos-cli',
        readonly: false,
      }),
      'system-admin-login',
    )

    // start-cli reads PASSWORD from its environment; passing it only for
    // this one exec keeps it out of logs, config files, and the store.
    const res = await subcontainer.exec([
      '/bin/sh',
      '-c',
      `PASSWORD="$DSH_MASTER_PASSWORD" start-cli auth login -H '${target.replace(/'/g, `'\\''`)}'`,
    ], {
      env: {
        DSH_MASTER_PASSWORD: input.password ?? '',
        XDG_DATA_HOME: '/data/startos-cli/data',
        XDG_CONFIG_HOME: '/data/startos-cli/config',
        HOME: '/data/startos-cli',
      },
      cwd: '/data/startos-cli',
    }, null)

    if (res.exitCode !== 0) {
      return {
        version: '1',
        title: i18n('Sign-in failed'),
        message: i18n(
          'start-cli could not sign in. Check the server address and master password, then try again.',
        ),
        result: null,
      }
    }

    return {
      version: '1',
      title: i18n('Session established'),
      message: i18n(
        'Signed in successfully. Full server administration is now available from this service.',
      ),
      result: {
        type: 'single',
        value: `start-cli -H ${target}`,
        copyable: true,
        qr: false,
        masked: false,
      },
    }
  },
)
