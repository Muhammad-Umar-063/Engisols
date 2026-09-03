'use client'

import { m, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'
import { Reveal } from '@/components/motion/Reveal'

/**
 * How we work — animation spec section 10.1.
 *
 * Sticky step nav on the left; the active step highlights as its content
 * passes the middle of the viewport. Per spec, this uses `useInView` with a
 * symmetric -45% margin (a narrow band across the viewport centre) and plain
 * React state — it fires a handful of times per scroll, so state is fine here
 * and a scrubbed motion value would be overkill.
 *
 * Mobile: no sticky nav; steps render as a plain vertical list in Reveals.
 */
export function StickyStepNav({ steps }: { steps: { title: string; body: string }[] }) {
  const [active, setActive] = useState(0)
  const { reduced } = useMotionPrefs()

  return (
    <div className="grid gap-step-5 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <nav aria-label="Process steps" className="hidden lg:block">
        <ol className="sticky top-32 space-y-step-1">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <a
                href={`#step-${i}`}
                className="block py-step-1 pl-step-2 text-sm no-underline transition-opacity duration-200"
                style={{
                  opacity: i === active ? 1 : 0.4,
                  transitionTimingFunction: 'var(--ease-micro)',
                }}
              >
                {i === active ? (
                  <m.span
                    layoutId="step-marker"
                    className="absolute left-0 top-0 h-full w-0.5 bg-cherry"
                    transition={reduced ? { duration: 0 } : EASE.spring}
                  />
                ) : null}
                {step.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-step-6">
        {steps.map((step, i) => (
          <Step key={step.title} index={i} onActive={setActive} {...step} />
        ))}
      </div>
    </div>
  )
}

function Step({
  title,
  body,
  index,
  onActive,
}: {
  title: string
  body: string
  index: number
  onActive: (i: number) => void
}) {
  const ref = useRef<HTMLElement>(null)
  // A narrow band across the viewport centre — the active step is the one the
  // reader is actually looking at, not whichever is topmost.
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })

  useEffect(() => {
    if (inView) onActive(index)
  }, [inView, index, onActive])

  return (
    <section ref={ref} id={`step-${index}`} className="scroll-mt-32">
      <Reveal y={8}>
        <h3 className="text-[clamp(1.25rem,2.2vw,1.75rem)]">{title}</h3>
        <p className="measure mt-step-2 text-bordeaux/80">{body}</p>
      </Reveal>
    </section>
  )
}
