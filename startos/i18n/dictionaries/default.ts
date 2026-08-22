export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting DeepSeek Harness — native DeepSeek API agent': 0,
  'DeepSeek Harness Agent': 1,
  'The DeepSeek Harness agent is running': 2,
  'The DeepSeek Harness agent is not responding': 3,
  'DeepSeek Web UI': 4,
  'The DeepSeek web interface is ready': 5,
  'The DeepSeek web interface is not responding yet': 6,
  'Starting DeepSeek Harness — native DeepSeek API agent (web UI enabled)': 7,
  // actions/configure.ts
  'Configure': 8,
  'Set your DeepSeek API key and model': 9,
  'DeepSeek API Key': 10,
  'Your key from platform.deepseek.com (sk-...). Stored only on your server.': 11,
  'Must look like sk-... (DeepSeek API key format)': 12,
  'Model': 13,
  'DeepSeek model id. Default: deepseek-chat': 14,
  'Lowercase letters, digits and dashes only': 15,
  // actions/open-web-ui.ts
  'Open Web UI': 16,
  'Get a clickable link to the DeepSeek Harness browser interface (dsh web). Also available under Interfaces.': 17,
  'No address is enabled yet. Enable one under this service’s Interfaces tab, then try again.': 18,
  'Click the link below to open the interface.': 19,
  'Web UI URL': 20,
  // interfaces.ts
  'The DeepSeek Harness browser interface (dsh web)': 21,
  // actions/system-admin.ts
  'Server address': 22,
  'The address you use to reach StartOS, e.g. node.local or 192.168.1.10': 23,
  'StartOS master password': 24,
  'Used once to sign in; never stored on disk or included in logs.': 25,
  'System Administration': 26,
  'Sign in to StartOS with the master password to administer the whole server from this panel.': 27,
  'Grants full control of your StartOS server. The password is used once for signing in and never saved.': 28,
  'Sign-in failed': 29,
  'start-cli could not sign in. Check the server address and master password, then try again.': 30,
  'Session established': 31,
  'Signed in successfully. Full server administration is now available from this service.': 32,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
