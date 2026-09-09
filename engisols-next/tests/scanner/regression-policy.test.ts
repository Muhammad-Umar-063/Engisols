import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertRegressionCorpus,
  parseRegressionConcurrency,
  regressionRunShouldFail,
} from '../../scripts/scanner-regression-policy'

test('parses bounded regression concurrency with a safe fallback', () => {
  assert.equal(parseRegressionConcurrency(undefined), 1)
  assert.equal(parseRegressionConcurrency('not-a-number'), 1)
  assert.equal(parseRegressionConcurrency('Infinity'), 1)
  assert.equal(parseRegressionConcurrency('0'), 1)
  assert.equal(parseRegressionConcurrency('-2'), 1)
  assert.equal(parseRegressionConcurrency('1.5'), 1)
  assert.equal(parseRegressionConcurrency('2'), 2)
  assert.equal(parseRegressionConcurrency('4'), 4)
  assert.equal(parseRegressionConcurrency('8'), 4)
})

test('rejects a non-array or empty regression corpus', () => {
  assert.throws(() => assertRegressionCorpus({}), TypeError)
  assert.throws(() => assertRegressionCorpus([]), TypeError)
  assert.doesNotThrow(() => assertRegressionCorpus([{ url: 'https://app.example' }]))
})

test('fails only incomplete or zero-scan regression runs', () => {
  assert.equal(
    regressionRunShouldFail({ processed: 3, scanned: 2 }, 3),
    false,
  )
  assert.equal(
    regressionRunShouldFail({ processed: 2, scanned: 2 }, 3),
    true,
  )
  assert.equal(
    regressionRunShouldFail({ processed: 3, scanned: 0 }, 3),
    true,
  )
})
