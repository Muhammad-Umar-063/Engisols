'use client'

import { m, AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Estimator conditional field — animation spec section 12.2.
 *
 * Expands into place only when a prior answer makes it relevant. Height runs
 * 0.28s; the inner content fades on a SHORTER 0.18s so text does not stretch
 * visibly mid-expansion. `overflow: hidden` on the animating wrapper is
 * mandatory — without it content spills during the collapse.
 *
 * `height: auto` is the deliberate exception to the transform-only rule
 * (acceptance checklist item 7): it runs once per toggle on a small element,
 * never on scroll.
 *
 * The wrapper is aria-live polite so a screen reader hears that a new question
 * appeared. Fields inside carry real labels, never placeholder-as-label.
 */
export function ConditionalField({ show, children }: { show: boolean; children: ReactNode }) {
  const { reduced } = useMotionPrefs()

  return (
    <div aria-live="polite">
      <AnimatePresence initial={false}>
        {show ? (
          <m.div
            key="field"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    height: { duration: 0.28, ease: EASE.enter },
                    opacity: { duration: 0.18, ease: EASE.micro },
                  }
            }
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-step-3">{children}</div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
