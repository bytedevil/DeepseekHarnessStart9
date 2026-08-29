import { sdk } from '../sdk'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { watchPassword } from './watchPassword'
import { taskApiKey } from './taskApiKey'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  setDependencies,
  actions,
  watchPassword,
  taskApiKey,
)

export const uninit = sdk.setupUninit(versionGraph)
