import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GOOGLE_ANALYTICS_ID,
  protectGoogleAnalyticsRoute,
} from '../../src/analytics/google'
import { replaceProductionScanHistory } from '../../src/production-check/paths'

test('public pages leave Google Analytics enabled', () => {
  const browser = {} as Window
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { value: browser, configurable: true })
  try {
    for (const url of ['/', '/services', '/ai-app-audit?utm_source=google', '/production-check']) {
      protectGoogleAnalyticsRoute(url)
      assert.equal(browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], undefined)
    }
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('private URLs disable collection through subsequent public navigation', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  try {
    for (const url of [
      '/production-check?scanId=private-scan',
      '/production-check/report/private-report',
      '/production-check/offer/private-offer',
      '/internal/production-check/review/private-review?token=private-token',
    ]) {
      const browser = {} as Window
      Object.defineProperty(globalThis, 'window', { value: browser, configurable: true })
      protectGoogleAnalyticsRoute(`https://www.engisols.com${url}`)
      assert.equal(browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true)
      protectGoogleAnalyticsRoute('/contact')
      assert.equal(browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true)
    }
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('starting a scan disables collection before changing browser history', () => {
  const browser = {} as Window
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { value: browser, configurable: true })
  try {
    let historyUpdated = false
    replaceProductionScanHistory({
      replaceState(_data, _unused, url) {
        assert.equal(browser[`ga-disable-${GOOGLE_ANALYTICS_ID}`], true)
        assert.equal(url, '/production-check?scanId=private-scan')
        historyUpdated = true
      },
    }, 'private-scan')
    assert.equal(historyUpdated, true)
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
