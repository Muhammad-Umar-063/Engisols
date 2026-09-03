'use client'

import { m, AnimatePresence } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { lockPageScroll, unlockPageScroll } from '@/components/motion/SmoothScroll'
import { EASE } from '@/lib/motion'

/**
 * Bottom sheet — animation spec section 14. Below 768px only; desktop uses a
 * centred dialog instead.
 *
 * Enter on the spring; exit 240ms EASE.enter. Upward drag is constrained to
 * zero so the sheet cannot be pulled above its open position; dismissal fires
 * on distance OR velocity, so a fast flick closes it even when short.
 *
 * Dialog semantics are real: role, aria-modal, Escape, backdrop click, body
 * scroll lock, and focus moved in on open and restored on close.
 */
export function SheetModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const { reduced } = useMotionPrefs()
  const sheetRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement
    sheetRef.current?.focus()

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Hidden overflow alone stops the scrollbar, not Lenis: it reads wheel
    // events and sets the scroll position itself, which a hidden-overflow
    // viewport still permits. Without this the page slides under the sheet.
    lockPageScroll()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      unlockPageScroll()
      window.removeEventListener('keydown', onKey)
      restoreFocus.current?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <m.div
            className="fixed inset-0 z-80 bg-bordeaux/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE.micro }}
            onClick={onClose}
          />
          <m.div
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-x-0 bottom-0 z-90 max-h-[85svh] overflow-y-auto rounded-t-2xl border-t border-greige/40 bg-vanilla p-step-4 outline-none"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={{ y: 0, opacity: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { y: '100%', transition: { duration: 0.24, ease: EASE.enter } }
            }
            transition={reduced ? { duration: 0 } : EASE.spring}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose()
            }}
          >
            <div aria-hidden className="mx-auto mb-step-3 h-1 w-10 rounded-full bg-greige" />
            <h2 className="text-xl">{title}</h2>
            <div className="mt-step-2">{children}</div>
          </m.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
