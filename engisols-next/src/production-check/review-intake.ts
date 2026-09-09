export const REVIEW_HELP_OPTIONS = [
  { value: 'verify', label: 'Verify what needs attention' },
  { value: 'fix', label: 'Plan and fix the urgent work' },
  { value: 'ongoing', label: 'Add senior engineering capacity' },
] as const

export const REVIEW_TIMELINE_OPTIONS = [
  { value: 'now', label: 'As soon as possible' },
  { value: 'month', label: 'Within the next month' },
  { value: 'quarter', label: 'Within this quarter' },
  { value: 'exploring', label: 'I am still exploring' },
] as const

export type ReviewHelp = (typeof REVIEW_HELP_OPTIONS)[number]['value']
export type ReviewTimeline = (typeof REVIEW_TIMELINE_OPTIONS)[number]['value']

export interface ReviewRequestContext {
  reportId: string
  targetUrl: string
  verdict: string
  recommendedAction: string
  fixNow: number
  review: number
  expected: number
  needsCodeReview: number
  builder?: string
  launchStage?: string
}

export interface ReviewRequestInput {
  name: string
  email: string
  help: ReviewHelp | ''
  timeline: ReviewTimeline | ''
  context: string
}

export interface ReviewRequestSubmission extends ReviewRequestInput {
  reportId: string
  website: string
}

export type ReviewRequestErrors = Partial<Record<keyof ReviewRequestInput, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateReviewRequest(input: ReviewRequestInput): ReviewRequestErrors {
  const errors: ReviewRequestErrors = {}
  if (!input.name.trim()) errors.name = 'Enter your name.'
  else if (input.name.trim().length > 100) errors.name = 'Keep your name under 100 characters.'

  const email = input.email.trim()
  if (!email) errors.email = 'Enter your work email.'
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'

  if (!REVIEW_HELP_OPTIONS.some(({ value }) => value === input.help)) {
    errors.help = 'Choose the kind of help you need.'
  }
  if (!REVIEW_TIMELINE_OPTIONS.some(({ value }) => value === input.timeline)) {
    errors.timeline = 'Choose a rough timeline.'
  }
  if (input.context.trim().length > 1_000) errors.context = 'Keep the project context under 1,000 characters.'
  return errors
}

export function buildReviewRequestText(
  input: ReviewRequestInput,
  context: ReviewRequestContext,
  reportUrl: string,
): string {
  const help = REVIEW_HELP_OPTIONS.find((option) => option.value === input.help)?.label ?? 'Not provided'
  const timeline = REVIEW_TIMELINE_OPTIONS.find((option) => option.value === input.timeline)?.label ?? 'Not provided'
  const optionalContext = cleanLineBreaks(input.context) || 'No additional context provided.'

  return [
    'Engineering review request',
    '',
    `Name: ${cleanLineBreaks(input.name)}`,
    `Reply email: ${cleanLineBreaks(input.email)}`,
    `Help needed: ${help}`,
    `Timeline: ${timeline}`,
    '',
    `App: ${context.targetUrl}`,
    `Report: ${reportUrl}`,
    `Report ID: ${context.reportId}`,
    `Finding summary: ${context.fixNow} fix now · ${context.review} review · ${context.expected} expected`,
    `Private controls needing code review: ${context.needsCodeReview}`,
    `Verdict: ${cleanLineBreaks(context.verdict)}`,
    `Recommended first action: ${cleanLineBreaks(context.recommendedAction)}`,
    context.builder ? `Builder: ${context.builder}` : '',
    context.launchStage ? `Launch stage: ${context.launchStage}` : '',
    '',
    'What I am trying to ship:',
    optionalContext,
  ].filter((line) => line !== '').join('\n')
}

export function parseReviewRequestSubmission(value: unknown): ReviewRequestSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const allowedKeys = new Set(['reportId', 'name', 'email', 'help', 'timeline', 'context', 'website'])
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return null

  const input = value as Record<string, unknown>
  if (
    typeof input.reportId !== 'string' ||
    typeof input.name !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.help !== 'string' ||
    typeof input.timeline !== 'string' ||
    typeof input.context !== 'string' ||
    (input.website !== undefined && typeof input.website !== 'string')
  ) {
    return null
  }

  const submission: ReviewRequestSubmission = {
    reportId: input.reportId,
    name: input.name.trim(),
    email: input.email.trim(),
    help: input.help as ReviewRequestInput['help'],
    timeline: input.timeline as ReviewRequestInput['timeline'],
    context: input.context.trim(),
    website: input.website ?? '',
  }
  return Object.keys(validateReviewRequest(submission)).length === 0 ? submission : null
}

export function reviewRequestSubject(targetUrl: string): string {
  try {
    return `Engineering review request — ${new URL(targetUrl).hostname}`
  } catch {
    return 'Engineering review request'
  }
}

function cleanLineBreaks(value: string): string {
  return value.trim().replace(/\r\n?/g, '\n')
}
