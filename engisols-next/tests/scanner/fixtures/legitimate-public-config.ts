function makeSupabaseToken(role: 'anon' | 'service_role'): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'supabase',
      ref: 'fixture-project',
      role,
      iat: 1_700_000_000,
      exp: 1_900_000_000,
    }),
  ).toString('base64url')
  return `${header}.${payload}.abcdefghijklmnopqrstuvwxyz012345`
}

export const supabaseAnonJwt = makeSupabaseToken('anon')
export const supabasePublishableKey =
  'sb_publishable_PuB1icConfigAbCdEfGhIjKlMnOp'
export const stripePublishableKey =
  'pk_live_51PublicClientConfigurationAbCdEf'

export const legitimatePublicConfig = `
  const supabaseUrl = 'https://fixture-project.supabase.co'
  const supabaseKey = '${supabaseAnonJwt}'
  const publishable = '${supabasePublishableKey}'
  const stripeKey = '${stripePublishableKey}'
  const client = createClient(supabaseUrl, supabaseKey)
`
