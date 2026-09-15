import { SITE } from '../../lib/site'
import {
  ResendDeliveryError,
  sendEmailWithResend,
} from '../email/resend'

export interface CustomerScopeEmailMessage {
  to: string
  subject: string
  text: string
  idempotencyKey: string
}

export type CustomerScopeEmailSender = (message: CustomerScopeEmailMessage) => Promise<void>

export class ScopeEmailConfigurationError extends Error {}
export class ScopeEmailDeliveryError extends Error {}

export async function sendCustomerScopeEmail(message: CustomerScopeEmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.PRODUCTION_CHECK_REVIEW_FROM ?? process.env.ENGISOLS_EMAIL_FROM
  if (!apiKey || !from) throw new ScopeEmailConfigurationError('Scope email delivery is not configured.')
  try {
    await sendEmailWithResend({
      replyTo: SITE.email,
      subject: message.subject,
      text: message.text,
      idempotencyKey: message.idempotencyKey,
      tags: [{ name: 'source', value: 'production-scope-review' }],
    }, {
      apiKey,
      from,
      to: message.to,
      userAgent: 'engisols-production-scope-review/1.0',
    })
  } catch (error) {
    if (error instanceof ResendDeliveryError) throw new ScopeEmailDeliveryError(error.message)
    throw error
  }
}
