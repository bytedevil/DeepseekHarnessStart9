import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  apiKey: Value.text({
    name: i18n('DeepSeek API Key'),
    description: i18n(
      'Your key from platform.deepseek.com (sk-...). Stored only on your server.',
    ),
    required: false,
    default: null,
    masked: true,
    patterns: [
      {
        regex: '^sk-[a-zA-Z0-9]+$',
        description: i18n('Must look like sk-... (DeepSeek API key format)'),
      },
    ],
  }),
  model: Value.text({
    name: i18n('Model'),
    description: i18n('DeepSeek model id. Default: deepseek-chat'),
    required: false,
    default: null,
    patterns: [
      {
        regex: '^[a-z0-9-]+$',
        description: i18n('Lowercase letters, digits and dashes only'),
      },
    ],
  }),
})

export const configure = sdk.Action.withInput(
  'configure',
  {
    name: i18n('Configure'),
    description: i18n('Set your DeepSeek API key and model'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  // Prefill
  async ({ effects }) => {
    const apiKey = await storeJson.read((s) => s.apiKey).once()
    const model = await storeJson.read((s) => s.model).once()
    return { apiKey, model }
  },
  // Handler
  async ({ effects, input }) => {
    if (input.apiKey !== undefined && input.apiKey !== null) {
      await storeJson.merge(effects, { apiKey: input.apiKey })
    }
    if (input.model !== undefined && input.model !== null) {
      await storeJson.merge(effects, { model: input.model })
    }
  },
)
