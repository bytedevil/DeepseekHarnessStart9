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
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
