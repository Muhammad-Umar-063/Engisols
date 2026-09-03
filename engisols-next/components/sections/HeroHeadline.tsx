import { Fragment } from 'react'

/**
 * Hero headline — animation spec section 3.2.
 *
 * SERVER component, CSS-only animation. This is the LCP text and must not
 * depend on JavaScript: each word ships wrapped in an overflow-hidden span with
 * a per-word `--i` delay, and `word-up` in globals.css does the rest. Word
 * level, never character level. Runs exactly once, on load.
 *
 * The inter-word space lives BETWEEN the `.w` wrappers, not inside them — a
 * trailing space inside an inline-block with overflow hidden collapses, which
 * renders the headline as one unbroken string.
 */
export function HeroHeadline({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <h1 className={`hero-h1 ${className ?? ''}`}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="w">
            <span style={{ '--i': i } as React.CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </h1>
  )
}
