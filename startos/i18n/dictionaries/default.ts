export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting DeepSeek Harness': 0,
  'Web Interface': 1,
  'The web interface is not responding yet': 2,
  'The web interface is ready': 3,
  'DeepSeek API': 4,
  'No API key set. Run the Set DeepSeek API Key action, or add one from the web interface.': 5,
  'Could not reach api.deepseek.com': 6,
  'The DeepSeek API accepted your key': 7,
  'Your DeepSeek account is out of credit. Top it up at platform.deepseek.com and the agent recovers on its own.': 8,
  'The DeepSeek API rejected the request: ${detail}': 9,
  // interfaces.ts
  'The DeepSeek Harness agent — chat, workspace files, and its shell': 10,
  // actions/setApiKey.ts
  'Set DeepSeek API Key': 11,
  'Store the key the agent uses to talk to DeepSeek': 12,
  'DeepSeek API Key': 13,
  'Your key from platform.deepseek.com. It is stored on this server and sent only to the DeepSeek API.': 14,
  'A DeepSeek API key, starting with sk-': 15,
  // actions/setPassword.ts
  'Set Web Interface Password': 16,
  'Reset Web Interface Password': 17,
  'Generate the password your browser asks for when opening the web interface. The username is always "admin".': 18,
  'The current password stops working as soon as this runs.': 19,
  'Web Interface Password Set': 20,
  'Save the password now — it is not shown again. Anyone who has it can run commands on this server through the agent.': 21,
  Username: 22,
  Password: 23,
  // init/taskApiKey.ts
  'The agent needs a DeepSeek API key before it can answer anything.': 24,
  // init/watchPassword.ts
  'The agent can run shell commands and has no login of its own — set a password before starting it': 25,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
