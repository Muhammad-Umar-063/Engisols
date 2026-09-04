/**
 * The Engisols logo, carried over from the previous site.
 *
 * Two changes from the original `engisols-logo-nav.svg`, both forced:
 *
 *   COLOUR. The source fills the letterforms with `#f0f0f0`, which is a
 *   near-white built for a permanently dark header. This header swaps ground —
 *   transparent-on-bordeaux over the hero, solid vanilla past it — so a fixed
 *   white wordmark disappears on half the site. The letterforms take
 *   `currentColor` and inherit whatever the surrounding ground has set.
 *
 *   THE TAGLINE. The source carries "YOUR ENGINEERING VANGUARD" as an SVG
 *   <text> node at 14px inside a 122-unit viewBox. Rendered at nav size that is
 *   roughly three pixels tall — noise rather than words — and it depends on a
 *   webfont being available inside an SVG, which is not guaranteed. It is also
 *   an all-caps letterspaced label, which build spec section 4 lists as a banned
 *   pattern. The viewBox is cropped to the lockup and the tagline is dropped.
 *
 * The red gradient is the brand mark's own, with ONE measured change to its
 * dark stop, #643232 to #9B3340.
 *
 * It is not a restyling. Measured in OKLCH the logo is already the site's red:
 * its stops sit at hue 21.0 and 19.9 against cherry's 19.3, which is the same
 * hue to within rounding. Only chroma differs — the bright end runs about 1.5x
 * cherry's saturation. Harmony was never the problem.
 *
 * Legibility was. The original dark stop scores 1.37:1 on bordeaux — below even
 * cherry's 1.64 — so on the dark header and in the footer the left end of the E
 * bar and part of the O glyph sank into the ground and the bar appeared to fade
 * out. That is a context the logo was never designed for: the old site put it on
 * dark only, and this header also appears on vanilla.
 *
 * #9B3340 lifts that end to 1.97:1, a 44% improvement, while keeping a 0.061
 * lightness gap to the bright stop so the gradient still reads as a ramp rather
 * than a flat bar. Anything lighter — #A63A46 at 2.23, #B4444F at 2.60 — closes
 * that gap and flattens the gradient, which is why the contrast was not pushed
 * to the 3:1 non-text threshold. Logos are exempt from that threshold anyway;
 * this is a visual fix, not a compliance one.
 *
 * Those ratios are lower than they were: lifting bordeaux to #43212a took every
 * one of them down by about 19%, and the ordering — original stop below cherry,
 * #9B3340 clearly above it — is unchanged. Rechecked on the lighter ground at
 * 3x on both the header and the footer; the bar still reads end to end, so the
 * stop stays where it is rather than chasing the old number.
 *
 * app/icon.svg is the untouched original brand file. It sits on a browser tab,
 * almost always light, where the dark stop was never a problem.
 *
 * `idPrefix` is required rather than convenient: two instances on one page
 * (header and footer) would otherwise define the same gradient ids twice, which
 * is invalid and resolves to whichever the browser saw first.
 */
export function Logo({
  idPrefix,
  className = '',
  title = 'Engisols',
}: {
  idPrefix: string
  className?: string
  title?: string
}) {
  const bar = `${idPrefix}-bar`
  const glyph = `${idPrefix}-glyph`

  return (
    <svg
      viewBox="0 0 516.24 77"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={bar} y1="5.18" x2="55.24" y2="5.18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9B3340" />
          <stop offset="1" stopColor="#cb1037" />
        </linearGradient>
        <linearGradient
          id={glyph}
          x1="330.05"
          y1="-2"
          x2="377.34"
          y2="79.91"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#9B3340" />
          <stop offset="1" stopColor="#cb1037" />
        </linearGradient>
      </defs>

      {/* Wordmark. currentColor, so it reads on any ground. */}
      <g fill="currentColor">
        <path d="M124,59.8V1.08h10.18V76.91H124.12L83,18.31v58.6H72.66V1.08H82.74Z" />
        <path d="M183.37,78c-22.42,0-37.8-16.58-37.8-39,0-22.64,15.38-39,37.05-39,17.33,0,29.9,10.18,34.55,25.46H205.69c-3.79-9.75-12-15.93-23-15.93-15.38,0-26.54,12.24-26.54,29.47,0,17,11.16,29.46,27.19,29.46a24.5,24.5,0,0,0,24.92-22.1H180.34v-9.2h38.24V41C218.58,64.89,203.31,78,183.37,78Z" />
        <path d="M240.83,76.91h-10.3V1.08h10.3Z" />
        <path d="M279.25,68.46c11.15,0,14.95-6.5,14.95-11.37C294.2,40.62,253,46.26,253,20.91c0-11.7,8.45-20.8,24-20.8C294.63.11,301.67,12,302.54,23.4H291.7c-1-6.61-4.76-13.76-14.51-13.76-7,0-13.65,3.68-13.65,10.29,0,16.47,41.27,12.35,41.27,37.27,0,10-6.39,20.8-25,20.8-18.31,0-27.84-8.89-29-23.73H262C262.78,64.35,270.15,68.46,279.25,68.46Z" />
        <path d="M415.52,67.71H454.2v9.2h-49V1.08h10.29Z" />
        <path d="M490.67,68.46c11.16,0,14.95-6.5,14.95-11.37,0-16.47-41.16-10.83-41.16-36.18,0-11.7,8.45-20.8,24.05-20.8C506.05.11,513.1,12,514,23.4H503.13c-1-6.61-4.77-13.76-14.52-13.76-7,0-13.65,3.68-13.65,10.29,0,16.47,41.28,12.35,41.28,37.27,0,10-6.39,20.8-25,20.8-18.3,0-27.84-8.89-29-23.73h11.27C474.21,64.35,481.57,68.46,490.67,68.46Z" />
        <rect y="32.9" width="55.24" height="9.46" />
        <rect y="65.32" width="55.24" height="9.51" />
      </g>

      {/* The two brand-red elements: the top bar of the E, and the O glyph. */}
      <rect fill={`url(#${bar})`} y="0.48" width="55.24" height="9.41" />
      <path
        fill={`url(#${glyph})`}
        d="M392.12,64.46c0,6.51-6.05,12.4-12.71,12.42-13.19,0-26.38,0-39.57,0a9.39,9.39,0,0,1-2.19,0,2.5,2.5,0,0,1-1.55-1,1.85,1.85,0,0,1,.42-1.64c2-2.13,4.09-4.2,6.15-6.27,2.35-2.37,4.75-4.69,7.06-7.09A5.55,5.55,0,0,1,354.08,59q10.25.07,20.5,0V44.91a10.1,10.1,0,0,1-.08-1.25c0-5.09-.13-10.18-.17-15.28a3.17,3.17,0,0,0-1.92-3.27c-1.39-.58-2.47,0-3.44,1s-2,2-3,2.92a3.32,3.32,0,0,0-1.12,2.62c0,5.31,0,10.62,0,15.94,0,2-.36,2.37-2.36,2.37-4.91,0-9.82,0-14.73,0a3.49,3.49,0,0,0-2.7,1.17q-7.47,7.54-15,15a9.27,9.27,0,0,1-4.13,2.6,8.61,8.61,0,0,1-10.65-8.25c-.06-9.24,0-18.47,0-27.71,0-6.08.1-12.16,0-18.24A14,14,0,0,1,326.41,1a10.33,10.33,0,0,1,2.08-.1l41,0a2.07,2.07,0,0,1,.87,0c.52.27,1.2.56,1.4,1a1.78,1.78,0,0,1-.42,1.52c-1.84,1.95-3.76,3.82-5.65,5.7-2.84,2.82-5.68,5.62-8.51,8.44A4.13,4.13,0,0,1,354,18.76q-10.38,0-20.78,0v15a10.14,10.14,0,0,1,0,1.24c0,1.59,0,3.18,0,4.78v1.76c0,2.66,0,5.31,0,8a2.92,2.92,0,0,0,1.71,3,2.81,2.81,0,0,0,3.27-.9c1.24-1.24,2.59-2.39,3.73-3.71a3.68,3.68,0,0,0,.82-2.26c0-5.09,0-10.18-.05-15.28,0-1.91.37-2.31,2.32-2.31,4.83,0,9.67,0,14.51,0a3.45,3.45,0,0,0,2.64-1.09c4.72-4.8,9.49-9.57,14.21-14.39,2.39-2.44,5.05-4.1,8.67-3.47a8.91,8.91,0,0,1,7,8.23Q392.15,40.88,392.12,64.46Z"
      />
    </svg>
  )
}
