import { createHash, randomBytes } from 'node:crypto'

import {
  LAUNCH_BLOCKER_FIX_PRICE_USD,
  LEAD_RECORD_LIFETIME_MS,
} from './config'
import { buildFounderReport } from './report'
import type { ReviewRequestSubmission } from './review-intake'
import { containsCredentialLikeValue } from './security'
import { qualifyProductionCheckLead } from './qualification'
import type { PersistedScan, ProductionCheckLead } from './types'

export class UnsafeLeadContentError extends Error {}

export function createProductionCheckLead(
  submission: ReviewRequestSubmission,
  scan: PersistedScan,
  now: () => Date = () => new Date(),
  createId?: () => string,
): ProductionCheckLead {
  if (!scan.result) throw new Error('A completed scan result is required to create a lead.')

  const createdAt = now()
  const report = buildFounderReport(scan.result, scan.answers.builder)
  const appUrl = sanitizeAppUrl(scan.result.target.finalUrl)
  const qualification = qualifyProductionCheckLead({
    launchStage: scan.answers.launchStage,
    helpNeeded: submission.help,
    timeline: submission.timeline,
    fixNow: report.counts.fixNow,
    review: report.counts.review,
    appUrl,
  })

  const lead: ProductionCheckLead = {
    id: createId?.() ?? createLeadIdForSubmission(scan.publicId, submission),
    scanId: scan.publicId,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + LEAD_RECORD_LIFETIME_MS).toISOString(),
    name: submission.name,
    email: submission.email,
    appUrl,
    ...(scan.answers.builder ? { builder: scan.answers.builder } : {}),
    ...(scan.answers.launchStage ? { launchStage: scan.answers.launchStage } : {}),
    helpNeeded: submission.help,
    timeline: submission.timeline,
    ...(submission.context ? { shippingContext: submission.context } : {}),
    attribution: structuredClone(scan.attribution),
    score: qualification.score,
    segment: qualification.segment,
    status: 'new',
    ...(qualification.segment === 'maybe'
      ? { estimatedValue: LAUNCH_BLOCKER_FIX_PRICE_USD }
      : {}),
    scanSummary: {
      publicRisk: report.publicSurfaceRisk,
      fixNow: report.counts.fixNow,
      review: report.counts.review,
      expected: report.counts.expected,
      exposureBand: report.exposureBand,
    },
    notification: { status: 'pending' },
  }

  if (containsCredentialLikeValue(lead)) {
    throw new UnsafeLeadContentError(
      'Remove passwords, API keys, or other credentials before sending this request.',
    )
  }
  return lead
}

export function markLeadNotification(
  lead: ProductionCheckLead,
  status: 'sent' | 'failed',
  attemptedAt: Date,
): ProductionCheckLead {
  return {
    ...lead,
    updatedAt: attemptedAt.toISOString(),
    notification: { status, attemptedAt: attemptedAt.toISOString() },
  }
}

export function buildLeadNotificationText(
  lead: ProductionCheckLead,
  reportUrl: string,
): string {
  const attribution = [
    ['Source', lead.attribution.source],
    ['Medium', lead.attribution.medium],
    ['Campaign', lead.attribution.campaign],
    ['Content', lead.attribution.content],
    ['Term', lead.attribution.term],
    ['Facebook click ID', lead.attribution.fbclid],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return [
    'Production Check lead',
    '',
    `Lead ID: ${lead.id}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `App URL: ${lead.appUrl}`,
    `Builder: ${lead.builder ?? 'Not provided'}`,
    `Launch stage: ${lead.launchStage ?? 'Not provided'}`,
    `Help needed: ${lead.helpNeeded}`,
    `Timeline: ${lead.timeline}`,
    `Score: ${lead.score}`,
    `Segment: ${lead.segment}`,
    '',
    'Scan summary:',
    `Public risk: ${lead.scanSummary.publicRisk}`,
    `FIX NOW: ${lead.scanSummary.fixNow}`,
    `REVIEW: ${lead.scanSummary.review}`,
    `EXPECTED: ${lead.scanSummary.expected}`,
    `Exposure band: ${lead.scanSummary.exposureBand}`,
    '',
    'Attribution:',
    ...(attribution.length
      ? attribution.map(([label, value]) => `${label}: ${value}`)
      : ['Not provided']),
    '',
    `Report: ${reportUrl}`,
    '',
    'Shipping context:',
    lead.shippingContext ?? 'No additional context provided.',
  ].join('\n')
}

export function createLeadId(): string {
  return `lead_${randomBytes(18).toString('base64url')}`
}

export function createLeadIdForSubmission(
  scanId: string,
  submission: ReviewRequestSubmission,
): string {
  const identity = JSON.stringify([
    scanId,
    normalizeIdentityText(submission.name),
    submission.email.trim().toLocaleLowerCase('en-US'),
    submission.help,
    submission.timeline,
    normalizeIdentityContext(submission.context),
  ])
  const digest = createHash('sha256').update(identity).digest('base64url').slice(0, 24)
  return `lead_${digest}`
}

function normalizeIdentityText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ')
}

function normalizeIdentityContext(value: string): string {
  return value.normalize('NFKC').trim().replace(/\r\n?/g, '\n')
}

function sanitizeAppUrl(value: string): string {
  const url = new URL(value)
  url.username = ''
  url.password = ''
  url.search = ''
  url.hash = ''
  return url.href
}
