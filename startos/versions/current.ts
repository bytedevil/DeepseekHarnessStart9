import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.0.4:0',
  releaseNotes: {
    en_US:
      'New System Administration action: sign in to StartOS with the master password and administer the whole server from this service. Author contact and PayPal donations updated.',
    es_ES:
      'Nueva acción de Administración del sistema: inicia sesión en StartOS con la contraseña maestra y administra todo el servidor desde este servicio. Contacto del autor y donaciones PayPal actualizados.',
    de_DE:
      'Neue Aktion „Systemverwaltung": Melde dich mit dem Masterpasswort bei StartOS an und verwalte den gesamten Server über diesen Dienst. Autorenkontakt und PayPal-Spenden aktualisiert.',
    pl_PL:
      'Nowa akcja Administracja systemem: zaloguj się do StartOS hasłem głównym i zarządzaj całym serwerem z tej usługi. Zaktualizowano kontakt autora i darowizny PayPal.',
    fr_FR:
      "Nouvelle action Administration système : connectez-vous à StartOS avec le mot de passe maître et administrez tout le serveur depuis ce service. Contact de l'auteur et dons PayPal mis à jour.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
