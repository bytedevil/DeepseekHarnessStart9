import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.0.1:0',
  releaseNotes: {
    en_US: 'First public release: native DeepSeek API agent + web UI with per-user project directories',
    es_ES: 'Primera versión pública: agente con API nativa de DeepSeek e interfaz web con directorios de proyecto por usuario',
    de_DE: 'Erste öffentliche Version: nativer DeepSeek-API-Agent mit Web-UI und Projektverzeichnissen',
    pl_PL: 'Pierwsze wydanie publiczne: agent z natywnym API DeepSeek oraz interfejs WWW z katalogami projektów',
    fr_FR: 'Première version publique : agent avec API native DeepSeek et interface web avec répertoires de projets',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
