import { setApiKey } from '../actions/setApiKey'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskApiKey = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await sdk.action.createOwnTask(effects, setApiKey, 'important', {
    reason: i18n(
      'The agent needs a DeepSeek API key before it can answer anything.',
    ),
  })
})
