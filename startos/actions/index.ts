import { sdk } from '../sdk'
import { setApiKey } from './setApiKey'
import { setPassword } from './setPassword'

export const actions = sdk.Actions.of()
  .addAction(setPassword)
  .addAction(setApiKey)
