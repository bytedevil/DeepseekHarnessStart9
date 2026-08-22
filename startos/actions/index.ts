import { sdk } from '../sdk'
import { configure } from './configure'
import { openWebUi } from './open-web-ui'
import { systemAdmin } from './system-admin'

export const actions = sdk.Actions.of()
  .addAction(configure)
  .addAction(openWebUi)
  .addAction(systemAdmin)
