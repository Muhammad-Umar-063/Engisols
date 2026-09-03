/**
 * Magnetic pull displacement.
 *
 * The contract: the element chases the pointer by `pullStrength` of the
 * pointer's distance from the element's own centre, then the result is hard
 * clamped to `maxPull` px. Defaults are 0.35 and 26.
 *
 * The clamp is on the displacement vector's magnitude, not per axis. Clamping
 * each axis separately would let a diagonal pull reach 26 * sqrt(2), about
 * 37px, so the element would travel visibly further toward a corner than
 * toward an edge. Magnitude clamping keeps the reachable area a circle, which
 * is what "never travels further than this from rest" actually means.
 */

export interface MagneticPullInput {
  pointer: { x: number; y: number }
  /** The element's rest rect, with no pull applied. */
  rect: { left: number; top: number; width: number; height: number }
  pullStrength?: number
  maxPull?: number
}

export const DEFAULT_PULL_STRENGTH = 0.35
export const DEFAULT_MAX_PULL = 26

export function magneticPull({
  pointer,
  rect,
  pullStrength = DEFAULT_PULL_STRENGTH,
  maxPull = DEFAULT_MAX_PULL,
}: MagneticPullInput): { x: number; y: number } {
  const centreX = rect.left + rect.width / 2
  const centreY = rect.top + rect.height / 2

  let x = (pointer.x - centreX) * pullStrength
  let y = (pointer.y - centreY) * pullStrength

  const distance = Math.hypot(x, y)
  if (distance > maxPull && distance > 0) {
    const scale = maxPull / distance
    x *= scale
    y *= scale
  }

  return { x, y }
}
