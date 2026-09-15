import assert from 'node:assert/strict'
import test from 'node:test'

import {
  qualifyProductionCheckLead,
  segmentProductionCheckScore,
} from '../../src/production-check/qualification'

const baseline = {
  launchStage: 'experimenting' as const,
  helpNeeded: 'verify' as const,
  timeline: 'exploring' as const,
  fixNow: 0,
  review: 0,
  appUrl: 'https://preview.vercel.app/',
}

test('applies launch-stage, help, timeline, finding, and custom-domain weights', () => {
  assert.equal(qualifyProductionCheckLead({ ...baseline, launchStage: 'preparing_to_launch' }).score, 2)
  assert.equal(qualifyProductionCheckLead({ ...baseline, launchStage: 'has_users' }).score, 3)
  assert.equal(qualifyProductionCheckLead({ ...baseline, launchStage: 'taking_payments' }).score, 4)
  assert.equal(qualifyProductionCheckLead({ ...baseline, helpNeeded: 'fix' }).score, 3)
  assert.equal(qualifyProductionCheckLead({ ...baseline, helpNeeded: 'ongoing' }).score, 4)
  assert.equal(qualifyProductionCheckLead({ ...baseline, timeline: 'now' }).score, 3)
  assert.equal(qualifyProductionCheckLead({ ...baseline, fixNow: 1 }).score, 2)
  assert.equal(qualifyProductionCheckLead({ ...baseline, review: 1 }).score, 1)
  assert.equal(qualifyProductionCheckLead({ ...baseline, appUrl: 'https://app.example.com/' }).score, 1)
})

test('keeps FIX NOW stronger than REVIEW without double-counting scan weight', () => {
  assert.equal(qualifyProductionCheckLead({ ...baseline, fixNow: 1, review: 4 }).score, 2)
})

test('does not treat IP literals as custom production domains', () => {
  assert.equal(qualifyProductionCheckLead({ ...baseline, appUrl: 'https://192.0.2.1/' }).score, 0)
  assert.equal(qualifyProductionCheckLead({ ...baseline, appUrl: 'https://[2001:db8::1]/' }).score, 0)
})

test('segments exact qualification boundaries', () => {
  assert.equal(segmentProductionCheckScore(3), 'nurture')
  assert.equal(segmentProductionCheckScore(4), 'maybe')
  assert.equal(segmentProductionCheckScore(8), 'maybe')
  assert.equal(segmentProductionCheckScore(9), 'qualified')
})

test('qualifies a clean live-payments app seeking ongoing engineering', () => {
  assert.deepEqual(qualifyProductionCheckLead({
    ...baseline,
    launchStage: 'taking_payments',
    helpNeeded: 'ongoing',
    timeline: 'exploring',
    appUrl: 'https://app.example.com/',
  }), { score: 9, segment: 'qualified' })
})

test('keeps an experimental app with many REVIEW findings out of qualified', () => {
  assert.deepEqual(qualifyProductionCheckLead({ ...baseline, review: 20 }), {
    score: 1,
    segment: 'nurture',
  })
})

test('treats urgent active-user fix work as a strong maybe without FIX NOW', () => {
  assert.deepEqual(qualifyProductionCheckLead({
    ...baseline,
    launchStage: 'has_users',
    helpNeeded: 'fix',
    timeline: 'now',
    appUrl: 'https://demo.vercel.app/',
  }), { score: 9, segment: 'qualified' })
})

test('keeps a clean hobby project in nurture', () => {
  assert.deepEqual(qualifyProductionCheckLead(baseline), { score: 0, segment: 'nurture' })
})
