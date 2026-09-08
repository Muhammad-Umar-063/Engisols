import { SITE } from '../../lib/site'
import {
  ResendDeliveryError,
  sendEmailWithResend,
  type ResendConfiguration as SharedResendConfiguration,
} from '../email/resend'

export interface ReviewEmailMessage {
  replyTo: string
  subject: string
  text: string
  idempotencyKey: string
}

export type ReviewEmailSender = (message: ReviewEmailMessage) => Promise<void>

export class ReviewEmailConfigurationError extends Error {}
export class ReviewEmailDeliveryError extends Error {}

export interface ResendConfiguration {
  apiKey: string
  from: string
  to: string
}

export async function sendReviewEmail(message: ReviewEmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.PRODUCTION_CHECK_REVIEW_FROM ?? process.env.ENGISOLS_EMAIL_FROM
  const to = process.env.PRODUCTION_CHECK_REVIEW_TO ?? process.env.ENGISOLS_EMAIL_TO ?? SITE.email
  if (!apiKey || !from) {
    throw new ReviewEmailConfigurationError('Review email delivery is not configured.')
  }
  await sendReviewEmailWithResend(message, { apiKey, from, to })
}

export async function sendReviewEmailWithResend(
  message: ReviewEmailMessage,
  configuration: ResendConfiguration,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  try {
    const sharedConfiguration: SharedResendConfiguration = {
      ...configuration,
      userAgent: 'engisols-production-check/1.0',
    }
    await sendEmailWithResend(
      { ...message, tags: [{ name: 'source', value: 'production-check' }] },
      sharedConfiguration,
      fetcher,
    )
  } catch (error) {
    if (error instanceof ResendDeliveryError) {
      throw new ReviewEmailDeliveryError(error.message)
    }
    throw error
  }
}
