'use client'

import { animate, useInView, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Proof-band counter — animation spec section 6.1.
 *
 * SSR strategy per spec: the FINAL number is server-rendered as plain text, so
 * it is in the HTML whether or not JS ever runs. On mount (below the fold, so
 * no visible flash) the value resets to 0 and counts up once on entering view.
 *
 * Values like "412K", "96.2%" and "$2.99B" carry prefixes, suffixes and
 * decimals, so the numeric core is animated and the affixes pass through.
 * Locale is pinned to en-US — an unpinned locale renders differently on server
 * and client and throws a hydration mismatch.
 */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const { reduced } = useMotionPrefs()
  const count = useMotionValue(0)
  const [display, setDisplay] = useState(value)

  // "$2.99B" → prefix "$", number 2.99, suffix "B".
  const match = value.match(/^([^\d.]*)([\d.,]+)(.*)$/)

  useEffect(() => {
    if (!inView || reduced || !match) return
    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr.replace(/,/g, ''))
    const decimals = (numStr.split('.')[1] ?? '').length

    const controls = animate(count, target, {
      duration: 1.1,
      ease: EASE.enter,
      onUpdate: (v) => {
        const formatted =
          decimals > 0
            ? v.toFixed(decimals)
            : Math.round(v).toLocaleString('en-US')
        setDisplay(`${prefix}${formatted}${suffix}`)
      },
    })
    return () => controls.stop()
  }, [inView, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
