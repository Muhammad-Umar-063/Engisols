import { generateKeyPairSync } from 'node:crypto'

import { supabaseAnonJwt } from './legitimate-public-config'

const servicePayload = Buffer.from(
  JSON.stringify({
    iss: 'supabase',
    ref: 'fixture-project',
    role: 'service_role',
  }),
).toString('base64url')

export const supabaseServiceRoleJwt = `${supabaseAnonJwt.split('.')[0]}.${servicePayload}.zyxwvutsrqponmlkjihgfedcba987654`
export const supabaseSecretKey =
  'sb_secret_SeRvErOnlyAbCdEfGhIjKlMnOpQrStUv'
export const stripeSecretKey =
  'sk_live_51ServerOnlyCredentialAbCdEfGhIj'
export const openAiSecretKey =
  'sk-proj-SeRvErOnLyAbCdEfGhIjKlMnOpQrStUvWxYz0123456789'
export const contextualOpenAiSecret =
  'Q7mN2vR9xK4pT8wY3cF6hJ1sD5bL0zA_uE-GiCq'
export const slackWebhook =
  'https://hooks.slack.com/services/T01234567/B01234567/AbCdEfGhIjKlMnOpQrStUvWx'
const generatedPrivateKey = generateKeyPairSync('ed25519').privateKey
export const privateKey = generatedPrivateKey.export({
  format: 'pem',
  type: 'pkcs8',
}).toString()

export const dangerousSecrets = `
  const serviceRole = '${supabaseServiceRoleJwt}'
  const supabaseSecret = '${supabaseSecretKey}'
  const stripeSecret = '${stripeSecretKey}'
  const OPENAI_API_KEY = '${openAiSecretKey}'
  const slack = '${slackWebhook}'
  const pem = ${JSON.stringify(privateKey)}
`
