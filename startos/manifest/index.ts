import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'deepseek-harness',
  title: 'DeepSeek Harness',
  license: 'MIT',
  author: 'Pau Font Martínez (@pfont_ on X)',
  packageRepo: 'https://github.com/bytedevil/DeepseekHarnessStart9',
  upstreamRepo: 'https://github.com/bytedevil/DeepseekHarnessStart9',
  supportSite: 'https://github.com/bytedevil/DeepseekHarnessStart9/issues',
  marketingUrl: 'https://api-docs.deepseek.com/',
  donationUrl:
    'https://www.paypal.com/paypalme/pfont?locale.x=ca_ES',
  description: { short, long },
  volumes: ['main'],
  images: {
    main: {
      source: {
        dockerBuild: {},
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
