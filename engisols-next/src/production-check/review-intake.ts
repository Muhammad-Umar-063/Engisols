import { SCOPE_CONCERNS, type ScopeAccessWillingness, type ScopeConcern } from './types'

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

export const SCOPE_CONCERN_OPTIONS: ReadonlyArray<{ value: ScopeConcern; label: string }> = [
  { value: 'security_customer_data', label: 'Security / customer data' },
  { value: 'payments', label: 'Payments' },
  { value: 'authentication_access', label: 'Authentication / user access' },
  { value: 'reliability_bugs', label: 'Reliability / bugs' },
  { value: 'launch_readiness', label: 'Getting ready to launch' },
  { value: 'scaling_architecture', label: 'Scaling / architecture' },
  { value: 'ongoing_development', label: 'Ongoing development' },
  { value: 'other', label: 'Something else' },
]

export const SCOPE_ACCESS_OPTIONS: ReadonlyArray<{
  value: ScopeAccessWillingness
  label: string
}> = [
  { value: 'yes_after_review', label: 'Yes, after you review the report' },
  { value: 'not_yet', label: 'Not yet' },
]

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
  concern: ScopeConcern | ''
  concernDetail: string
  accessWillingness: ScopeAccessWillingness | ''
}

export interface ReviewRequestSubmission
  extends Omit<ReviewRequestInput, 'help' | 'timeline' | 'concern' | 'accessWillingness'> {
  reportId: string
  help: ReviewHelp
  timeline: ReviewTimeline
  concern: ScopeConcern
  accessWillingness: ScopeAccessWillingness
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
  if (!SCOPE_CONCERNS.includes(input.concern as ScopeConcern)) {
    errors.concern = 'Choose your main concern.'
  }
  if (!SCOPE_ACCESS_OPTIONS.some(({ value }) => value === input.accessWillingness)) {
    errors.accessWillingness = 'Choose whether we may ask for limited evidence later.'
  }
  if (input.concernDetail.trim().length > 500) {
    errors.concernDetail = 'Keep the concern detail under 500 characters.'
  }
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
  const concern = SCOPE_CONCERN_OPTIONS.find((option) => option.value === input.concern)?.label ?? 'Not provided'
  const access = SCOPE_ACCESS_OPTIONS.find((option) => option.value === input.accessWillingness)?.label ?? 'Not provided'

  return [
    'Engineering review request',
    '',
    `Name: ${cleanLineBreaks(input.name)}`,
    `Reply email: ${cleanLineBreaks(input.email)}`,
    `Help needed: ${help}`,
    `Timeline: ${timeline}`,
    `Main concern: ${concern}`,
    `Limited technical evidence: ${access}`,
    ...(input.concernDetail.trim()
      ? ['', 'Concern detail:', cleanLineBreaks(input.concernDetail)]
      : []),
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
  const allowedKeys = new Set([
    'reportId', 'name', 'email', 'help', 'timeline', 'context', 'website',
    'concern', 'concernDetail', 'accessWillingness',
  ])
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return null

  const input = value as Record<string, unknown>
  if (
    typeof input.reportId !== 'string' ||
    typeof input.name !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.help !== 'string' ||
    typeof input.timeline !== 'string' ||
    typeof input.context !== 'string' ||
    typeof input.concern !== 'string' ||
    typeof input.concernDetail !== 'string' ||
    typeof input.accessWillingness !== 'string' ||
    (input.website !== undefined && typeof input.website !== 'string')
  ) {
    return null
  }
  if (
    !isReviewHelp(input.help) ||
    !isReviewTimeline(input.timeline) ||
    !SCOPE_CONCERNS.includes(input.concern as ScopeConcern) ||
    !SCOPE_ACCESS_OPTIONS.some(({ value }) => value === input.accessWillingness)
  ) return null

  const submission: ReviewRequestSubmission = {
    reportId: input.reportId,
    name: input.name.trim(),
    email: input.email.trim(),
    help: input.help,
    timeline: input.timeline,
    context: input.context.trim(),
    concern: input.concern as ScopeConcern,
    concernDetail: input.concernDetail.trim(),
    accessWillingness: input.accessWillingness as ScopeAccessWillingness,
    website: input.website ?? '',
  }
  return Object.keys(validateReviewRequest(submission)).length === 0 ? submission : null
}

function isReviewHelp(value: string): value is ReviewHelp {
  return REVIEW_HELP_OPTIONS.some((option) => option.value === value)
}

function isReviewTimeline(value: string): value is ReviewTimeline {
  return REVIEW_TIMELINE_OPTIONS.some((option) => option.value === value)
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
