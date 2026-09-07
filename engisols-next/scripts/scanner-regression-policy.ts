const MAX_REGRESSION_CONCURRENCY = 4

export function parseRegressionConcurrency(value: string | undefined): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return 1
  }
  return Math.min(parsed, MAX_REGRESSION_CONCURRENCY)
}

export function assertRegressionCorpus(
  value: unknown,
): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError('Regression corpus must be a non-empty array.')
  }
}

export function regressionRunShouldFail(
  totals: { processed: number; scanned: number },
  corpusSize: number,
): boolean {
  return totals.processed !== corpusSize || totals.scanned === 0
}
