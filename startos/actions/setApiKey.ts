import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  apiKey: Value.text({
    name: i18n('DeepSeek API Key'),
    description: i18n(
      'Your key from platform.deepseek.com. It is stored on this server and sent only to the DeepSeek API.',
    ),
    required: false,
    default: null,
    masked: true,
    placeholder: 'sk-...',
    patterns: [
      {
        regex: '^sk-[A-Za-z0-9_-]+$',
        description: i18n('A DeepSeek API key, starting with sk-'),
      },
    ],
  }),
})

export const setApiKey = sdk.Action.withInput(
  'set-api-key',
  {
    name: i18n('Set DeepSeek API Key'),
    description: i18n('Store the key the agent uses to talk to DeepSeek'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  // Prefill
  async () => ({ apiKey: await storeJson.read((s) => s.apiKey).once() }),
  // Handler
  async ({ effects, input }) =>
    storeJson.merge(effects, { apiKey: input.apiKey ?? '' }),
)
