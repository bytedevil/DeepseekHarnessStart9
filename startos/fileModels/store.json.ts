import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

/**
 * Persistent service settings. The API key lives here (on the user's own
 * server volume) and is injected into the agent container as an env var.
 */
const shape = z.object({
  apiKey: z.string().catch(''),
  model: z.string().catch('deepseek-chat'),
  pollSeconds: z.number().catch(30),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
