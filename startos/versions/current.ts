import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.0.3:0',
  releaseNotes: {
    en_US:
      'Agent tools repaired: bash sandbox (landlock/bwrap) and ripgrep search binaries now ship in the image; realtime chat and directory listing fixes from 0.0.2 retained.',
    es_ES:
      'Herramientas del agente reparadas: el sandbox bash (landlock/bwrap) y los binarios de búsqueda ripgrep ahora se incluyen en la imagen; se mantienen las correcciones de chat en tiempo real y listado de directorios de 0.0.2.',
    de_DE:
      'Agent-Tools repariert: Bash-Sandbox (landlock/bwrap) und Ripgrep-Binaries sind jetzt im Image enthalten; Korrekturen für Echtzeit-Chat und Verzeichnisliste aus 0.0.2 beibehalten.',
    pl_PL:
      'Naprawiono narzędzia agenta: sandbox bash (landlock/bwrap) i binaria ripgrep są teraz w obrazie; zachowano poprawki czatu i listy katalogów z 0.0.2.',
    fr_FR:
      'Outils de l'agent réparés : sandbox bash (landlock/bwrap) et binaires ripgrep désormais inclus dans l'image ; corrections du chat temps réel et du listage (0.0.2) conservées.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
