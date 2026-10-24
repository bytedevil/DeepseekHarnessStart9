import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { uiUsername } from '../utils'

export const setPassword = sdk.Action.withoutInput(
  'set-password',

  async ({ effects }) => {
    const alreadySet = !!(await storeJson
      .read((s) => s?.uiPassword)
      .const(effects))
    return {
      name: alreadySet
        ? i18n('Reset Web Interface Password')
        : i18n('Set Web Interface Password'),
      description: i18n(
        'Generate the password your browser asks for when opening the web interface. The username is always "admin".',
      ),
      warning: alreadySet
        ? i18n('The current password stops working as soon as this runs.')
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })
    await storeJson.merge(effects, { uiPassword: password })

    return {
      version: '1' as const,
      title: i18n('Web Interface Password Set'),
      message: i18n(
        'Save the password now — it is not shown again. Anyone who has it can run commands on this server through the agent.',
      ),
      result: {
        type: 'group' as const,
        value: [
          {
            type: 'single' as const,
            name: i18n('Username'),
            description: null,
            value: uiUsername,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single' as const,
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
