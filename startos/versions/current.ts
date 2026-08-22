import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.0.2:0',
  releaseNotes: {
    en_US:
      'Realtime chat fixed (WebSocket + streaming through the proxy), directory listing 403 fixed (Host rewritten to loopback), projects workspace at /data/projects, DeepSeek Harness logo added.',
    es_ES:
      'Chat en tiempo real corregido (WebSocket y streaming a través del proxy), error 403 del listado de directorios resuelto (Host reescrito a loopback), espacio de proyectos en /data/projects y logo de DeepSeek Harness añadido.',
    de_DE:
      'Echtzeit-Chat korrigiert (WebSocket und Streaming über den Proxy), 403-Fehler der Verzeichnisliste behoben (Host auf Loopback umgeschrieben), Projektordner unter /data/projects, DeepSeek-Harness-Logo hinzugefügt.',
    pl_PL:
      'Naprawiono czat w czasie rzeczywistym (WebSocket i strumieniowanie przez proxy), naprawiono błąd 403 listy katalogów (nagłówek Host przepisywany na loopback), katalog projektów /data/projects, dodano logo DeepSeek Harness.',
    fr_FR:
      'Chat en temps réel corrigé (WebSocket et streaming via le proxy), erreur 403 du listage des répertoires résolue (Host réécrit vers loopback), espace projets dans /data/projects, logo DeepSeek Harness ajouté.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
