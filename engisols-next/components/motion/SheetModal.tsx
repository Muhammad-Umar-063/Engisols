'use client'

import { m, AnimatePresence } from 'motion/react'
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { lockPageScroll, unlockPageScroll } from '@/components/motion/SmoothScroll'
import { EASE } from '@/lib/motion'

/**
 * Modal — animation spec section 14. Two presentations of one dialog.
 *
 * BELOW 768px, a bottom sheet: enters on the spring from the bottom edge, exit
 * 240ms EASE.enter, and draggable. Upward drag is constrained to zero so it
 * cannot be pulled above its open position; dismissal fires on distance OR
 * velocity, so a fast flick closes it even when the throw is short.
 *
 * AT 768px AND ABOVE, a centred dialog that scales up from 96%. A sheet on a
 * desktop is a phone gesture on a machine with no thumb near the bottom of the
 * screen: it drops the content to the far edge of a 1440px viewport, spans the
 * full width for a form that needs about half of it, and offers a drag handle
 * to a mouse that has nothing to drag it with.
 *
 * The spec asked for exactly this from the start — "below 768px only; desktop
 * uses a centred dialog instead" — and the desktop half was never built, so
 * every caller got the sheet at every width. The comment described the intent
 * and the code did something else.
 *
 * Centring is a grid, not a translate: Motion writes `transform` to animate the
 * scale, which would overwrite a `-translate-x-1/2` and throw the dialog to the
 * bottom-right corner mid-animation. The centring wrapper takes no pointer
 * events, so a click on the space around the dialog still reaches the backdrop.
 *
 * Dialog semantics are real in both: role, aria-modal, Escape, backdrop click,
 * body scroll lock, and focus moved in on open and restored on close.
 *
 * `data-lenis-prevent` is what makes the dialog scrollable, and it is not
 * optional on either branch. Lenis takes over the wheel for the whole document
 * and calls preventDefault on every event, so a nested `overflow-y: auto` never
 * receives one: a dialog taller than the viewport had a working scrollbar and a
 * dead wheel — measured, 997px of content in a 763px box and a 400px wheel
 * moving scrollTop by zero. The attribute is Lenis's own opt-out and hands the
 * wheel back to the browser inside this element. `lockPageScroll()` above stops
 * Lenis but does not release the listener, so stopping it is not enough.
 */
const WIDE = '(min-width: 48rem)'

function subscribeToWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function isWide() {
  return window.matchMedia(WIDE).matches
}

export function SheetModal({
  open,
  onClose,
  title,
  children,
  themeClassName = '',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  themeClassName?: string
}) {
  const { reduced } = useMotionPrefs()
  const sheetRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  // `useSyncExternalStore`, not an effect that calls setState: a media query is
  // an external store, and this is the API for reading one. It also gives an
  // explicit server snapshot — false, the sheet — so nothing has to guess
  // during SSR, and there is no render where the value is briefly wrong.
  const centred = useSyncExternalStore(subscribeToWide, isWide, () => false)

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement
    // The same dialog instance can reopen after an error or a long project
    // disclosure. Always begin at its heading instead of preserving an old
    // internal scroll position and making the top of the next flow disappear.
    if (sheetRef.current) sheetRef.current.scrollTop = 0
    sheetRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !sheetRef.current) return
      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'))
      if (!focusable.length) {
        event.preventDefault()
        sheetRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
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

  const modal = (
    <div className={themeClassName} data-ph-replay-visible="dialog-portal">
      <AnimatePresence>
      {open ? (
        <>
          <m.div
            data-ph-replay-visible="dialog-overlay"
            className="fixed inset-0 z-80 bg-bordeaux/55 supports-[backdrop-filter]:backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE.micro }}
            onClick={onClose}
          />
          {centred ? (
            <div className="pointer-events-none fixed inset-0 z-90 grid place-items-center p-step-3">
              <m.div
                data-ph-replay-visible="dialog"
                ref={sheetRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                data-lenis-prevent
                className="pointer-events-auto max-h-[92svh] w-[min(44rem,100%)] overflow-y-auto overscroll-contain rounded-2xl border border-greige/50 bg-vanilla p-step-4 shadow-[0_40px_90px_-50px_rgba(23,23,23,0.75)] outline-none"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.98,
                        y: 4,
                        transition: { duration: 0.16, ease: EASE.micro },
                      }
                }
                transition={reduced ? { duration: 0 } : { duration: 0.28, ease: EASE.enter }}
              >
                <ModalHeading title={title} onClose={onClose} />
                <div className="mt-step-3">{children}</div>
              </m.div>
            </div>
          ) : (
            <m.div
              data-ph-replay-visible="dialog"
              ref={sheetRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              data-lenis-prevent
              className="fixed inset-x-0 bottom-0 z-90 max-h-[92svh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-greige/50 bg-vanilla p-step-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:p-step-4"
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
              {/* The grab handle belongs to the gesture, so it exists only
                  where the gesture does. */}
              <div aria-hidden className="mx-auto mb-step-3 h-1 w-10 rounded-full bg-greige" />
              <ModalHeading title={title} onClose={onClose} />
              <div className="mt-step-2">{children}</div>
            </m.div>
          )}
        </>
      ) : null}
      </AnimatePresence>
    </div>
  )

  // Several callers live inside animated surfaces whose transform creates a
  // containing block. Portalling keeps `position: fixed` anchored to the
  // viewport instead of letting a scrolled/animated ancestor move the sheet.
  return typeof document === 'undefined' ? modal : createPortal(modal, document.body)
}

function ModalHeading({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-step-3">
      <h2 className="text-xl">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-bordeaux/30 text-bordeaux transition-colors hover:border-bordeaux hover:bg-oat/60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  )
}
