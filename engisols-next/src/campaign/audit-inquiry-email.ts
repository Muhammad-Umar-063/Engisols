import { SITE } from '../../lib/site'
import { ResendDeliveryError, sendEmailWithResend } from '../email/resend'

export interface AuditInquiryEmailMessage {
  replyTo: string
  subject: string
  text: string
  idempotencyKey: string
}

export type AuditInquiryEmailSender = (message: AuditInquiryEmailMessage) => Promise<void>

export class AuditInquiryEmailConfigurationError extends Error {}
export class AuditInquiryEmailDeliveryError extends Error {}

export interface AuditInquiryResendConfiguration {
  apiKey: string
  from: string
  to: string
}

export async function sendAuditInquiryEmail(message: AuditInquiryEmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AI_APP_AUDIT_INQUIRY_FROM ?? process.env.ENGISOLS_EMAIL_FROM
  const to = process.env.AI_APP_AUDIT_INQUIRY_TO ?? process.env.ENGISOLS_EMAIL_TO ?? SITE.email
  if (!apiKey || !from) {
    throw new AuditInquiryEmailConfigurationError('AI app audit email delivery is not configured.')
  }

  await sendAuditInquiryEmailWithResend(message, { apiKey, from, to })
}

export async function sendAuditInquiryEmailWithResend(
  message: AuditInquiryEmailMessage,
  configuration: AuditInquiryResendConfiguration,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  try {
    await sendEmailWithResend(
      { ...message, tags: [{ name: 'source', value: 'ai-app-audit' }] },
      { ...configuration, userAgent: 'engisols-ai-app-audit/1.0' },
      fetcher,
    )
  } catch (error) {
    if (error instanceof ResendDeliveryError) {
      throw new AuditInquiryEmailDeliveryError(error.message)
    }
    throw error
  }
}
