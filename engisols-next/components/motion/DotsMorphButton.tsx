'use client'

import { m, AnimatePresence } from 'motion/react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Estimator submit — animation spec section 12.3.
 *
 * Three states: idle (label), pending (three bouncing dots), done (a check,
 * held for 900ms before the caller fires the toast and returns it to idle —
 * that sequencing lives in the caller).
 *
 * `layout` on the button animates its width between states rather than
 * snapping. `aria-busy` and disabled while pending; under reduced motion the
 * dots hold static and a text status replaces the bounce.
 *
 * No confetti.
 */
export function DotsMorphButton({
  id,
  label,
  state,
}: {
  id?: string
  label: string
  state: 'idle' | 'pending' | 'done'
}) {
  const { reduced } = useMotionPrefs()

  return (
    <m.button
      id={id}
      layout
      type="submit"
      disabled={state !== 'idle'}
      aria-busy={state === 'pending'}
      className="relative min-w-36 rounded-full bg-cherry px-step-4 py-step-2 font-medium text-vanilla transition-opacity disabled:opacity-85"
      transition={reduced ? { duration: 0 } : EASE.spring}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'pending' ? (
          <m.span
            key="dots"
            className="flex items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: EASE.micro }}
          >
            {reduced ? (
              <span className="text-sm">Sending…</span>
            ) : (
              [0, 1, 2].map((i) => (
                <m.span
                  key={i}
                  className="block size-1.5 rounded-full bg-vanilla"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: EASE.micro,
                    delay: i * 0.12,
                  }}
                />
              ))
            )}
          </m.span>
        ) : state === 'done' ? (
          <m.span
            key="done"
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE.micro }}
            aria-label="Sent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </m.span>
        ) : (
          <m.span
            key="label"
            className="block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: EASE.micro }}
          >
            {label}
          </m.span>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {state === 'pending' ? 'Submitting' : state === 'done' ? 'Sent' : ''}
      </span>
    </m.button>
  )
}
