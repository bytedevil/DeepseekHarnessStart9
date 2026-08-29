import { setPassword } from '../actions/setPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Critical, so the service cannot start before the gate in interfaces.ts has a
// credential; setting one retracts the task.
export const watchPassword = sdk.setupOnInit(async (effects) => {
  if (!(await storeJson.read((s) => s?.uiPassword).const(effects))) {
    await sdk.action.createOwnTask(effects, setPassword, 'critical', {
      reason: i18n(
        'The agent can run shell commands and has no login of its own — set a password before starting it',
      ),
    })
  }
})
