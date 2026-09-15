export interface AuditInquiryInput {
  name: string
  email: string
  app: string
  worry: string
}

export interface AuditInquirySubmission extends AuditInquiryInput {
  website: string
  attributionToken: string
}

export type AuditInquiryErrors = Partial<Record<keyof AuditInquiryInput, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateAuditInquiry(input: AuditInquiryInput): AuditInquiryErrors {
  const errors: AuditInquiryErrors = {}
  const name = input.name.trim()
  const email = input.email.trim()
  const app = input.app.trim()
  const worry = input.worry.trim()

  if (!name) errors.name = 'Enter your name.'
  else if (name.length > 100) errors.name = 'Keep your name under 100 characters.'

  if (!email) errors.email = 'Enter your work email.'
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'

  if (!app) errors.app = 'Enter the app URL or product name.'
  else if (app.length > 300) errors.app = 'Keep the app detail under 300 characters.'

  if (!worry) errors.worry = 'Tell us what you want an engineer to investigate.'
  else if (worry.length > 1_000) errors.worry = 'Keep this under 1,000 characters.'

  return errors
}

export function parseAuditInquirySubmission(value: unknown): AuditInquirySubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const allowedKeys = new Set(['name', 'email', 'app', 'worry', 'website', 'attributionToken'])
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return null

  const input = value as Record<string, unknown>
  if (
    typeof input.name !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.app !== 'string' ||
    typeof input.worry !== 'string' ||
    (input.website !== undefined && typeof input.website !== 'string') ||
    typeof input.attributionToken !== 'string' ||
    !input.attributionToken ||
    input.attributionToken.length > 4_096
  ) return null

  const submission: AuditInquirySubmission = {
    name: input.name.trim(),
    email: input.email.trim(),
    app: input.app.trim(),
    worry: input.worry.trim(),
    website: input.website ?? '',
    attributionToken: input.attributionToken,
  }
  return Object.keys(validateAuditInquiry(submission)).length === 0 ? submission : null
}

export function auditInquirySubject(app: string): string {
  const cleaned = cleanLineBreaks(app)
  try {
    const value = /^[a-z][a-z\d+.-]*:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
    return `AI app audit request — ${new URL(value).hostname}`
  } catch {
    return `AI app audit request — ${cleaned.slice(0, 80)}`
  }
}

function cleanLineBreaks(value: string): string {
  return value.trim().replace(/\r\n?/g, '\n')
}
