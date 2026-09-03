/**
 * How many copies of the content a ticker must render.
 *
 * The invariant that has to hold: at every wrap offset, the visible strip is
 * fully covered. The strip slides between 0 and -copyWidth, so the rendered
 * width must be at least containerWidth + copyWidth. Anything less and a gap
 * opens at the trailing edge for part of every cycle. It shows up as a flicker
 * once per loop, which is easy to misread as a rendering bug.
 */
export function tickerRepeatCount(containerWidth: number, copyWidth: number) {
  if (copyWidth <= 0) return 2
  return Math.ceil(containerWidth / copyWidth) + 2
}

/**
 * True when the count above actually covers the strip.
 *
 * The source ships this for its test suite. This repo has no test runner, so it
 * is wired into VelocityTicker as a development-only assertion instead — same
 * invariant, checked against real measured widths rather than fixtures.
 */
export function coversStrip(containerWidth: number, copyWidth: number, repeat: number) {
  return repeat * copyWidth >= containerWidth + copyWidth
}
