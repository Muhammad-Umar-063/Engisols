import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildReviewRequestText,
  parseReviewRequestSubmission,
  reviewRequestSubject,
  validateReviewRequest,
  type ReviewRequestContext,
  type ReviewRequestInput,
} from '../../src/production-check/review-intake'

const input: ReviewRequestInput = {
  name: 'Ada Founder',
  email: 'ada@example.com',
  help: 'ongoing',
  timeline: 'month',
  context: 'We need to onboard our first paying customers.',
}

const context: ReviewRequestContext = {
  reportId: 'rpt_DemoPartialReport0000001',
  targetUrl: 'https://app.example.com/dashboard',
  verdict: 'Important production checks still need code review.',
  recommendedAction: 'Verify authorization around the payments table.',
  fixNow: 0,
  review: 2,
  expected: 1,
  needsCodeReview: 4,
  builder: 'lovable',
  launchStage: 'taking_payments',
}

test('validates the minimum review request without collecting the report again', () => {
  assert.deepEqual(validateReviewRequest(input), {})
  assert.deepEqual(validateReviewRequest({ ...input, name: '', email: 'wrong', help: '', timeline: '' }), {
    name: 'Enter your name.',
    email: 'Enter a valid email address.',
    help: 'Choose the kind of help you need.',
    timeline: 'Choose a rough timeline.',
  })
})

test('builds a review handoff containing the report and qualification context', () => {
  const reportUrl = 'https://engisols.com/production-check/report/rpt_DemoPartialReport0000001'
  const body = buildReviewRequestText(input, context, reportUrl)
  assert.match(body, /Ada Founder/)
  assert.match(body, /Add senior engineering capacity/)
  assert.match(body, /Within the next month/)
  assert.match(body, /0 fix now · 2 review · 1 expected/)
  assert.match(body, /Private controls needing code review: 4/)
  assert.match(body, new RegExp(reportUrl))
})

test('parses only bounded review request fields and valid option values', () => {
  assert.deepEqual(
    parseReviewRequestSubmission({ reportId: context.reportId, ...input, website: '' }),
    { reportId: context.reportId, ...input, website: '' },
  )
  assert.equal(parseReviewRequestSubmission({ reportId: context.reportId, ...input, help: 'arbitrary', website: '' }), null)
  assert.equal(parseReviewRequestSubmission({ reportId: context.reportId, ...input, admin: true, website: '' }), null)
  assert.equal(reviewRequestSubject(context.targetUrl), 'Engineering review request — app.example.com')
})
