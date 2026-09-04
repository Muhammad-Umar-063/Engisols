/**
 * Scroll mapping for the horizontal case-studies gallery
 * (components/motion/HorizontalScrollGallery.tsx). Adapted from the motion.dev
 * `react-scroll-horizontal` reference.
 *
 * The gallery translates from the first item centred to the last item centred,
 * so the total travel is exactly the distance between the first and last item's
 * left edges. With a uniform row that equals (count - 1) * (itemWidth + gap),
 * but the component MEASURES it from the DOM instead of computing it, which
 * keeps the mapping correct when the card width or gap changes at a breakpoint.
 * These helpers are the pure arithmetic, split out so they can be unit-reasoned
 * about without a DOM.
 */

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Container height for a given horizontal travel distance.
 *
 * `speed` 1 means one pixel of vertical scroll per pixel of horizontal travel —
 * the mapping that feels neutral. Below 1 the row races ahead of the scroll and
 * feels slippery; above 1 it drags. The viewport is added because the sticky
 * child holds a full screen while the container's remaining height is the
 * scrollable runway that drives the translation.
 */
export function containerHeightForTravel(
  travel: number,
  viewportHeight: number,
  speed = 1,
): number {
  return viewportHeight + Math.max(travel, 0) * speed
}

/**
 * Vertical scroll position that puts item `index` in the centre of the screen.
 *
 * Needed because a translated row breaks keyboard navigation: tabbing to an
 * item off to the right does not bring it into view, since nothing is actually
 * scrolled horizontally. Focus has to be translated back into a window scroll
 * position by hand.
 */
export function scrollTopForIndex({
  index,
  count,
  containerTop,
  containerHeight,
  viewportHeight,
}: {
  index: number
  count: number
  /** Container's offset from the top of the document. */
  containerTop: number
  containerHeight: number
  viewportHeight: number
}): number {
  if (count <= 1) return containerTop

  // offset ["start start", "end end"] means progress runs across the container's
  // scrollable height, which is its own height minus one viewport.
  const runway = Math.max(containerHeight - viewportHeight, 0)
  const progress = clamp(index / (count - 1), 0, 1)

  return containerTop + progress * runway
}
