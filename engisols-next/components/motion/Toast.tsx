'use client'

import { m, AnimatePresence } from 'motion/react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Toast — animation spec section 2.4.
 *
 * Bottom right on desktop, bottom centre on mobile. Enters on the spring,
 * exits in 160ms. Stacked toasts use `layout` so existing ones shift up
 * smoothly as new ones arrive — the spec's chosen stacking model.
 *
 * Success: role="status", aria-live polite, auto-dismisses after 5s but pauses
 * while hovered or focused. Errors: role="alert", assertive, and NEVER
 * auto-dismiss — an error the user did not get to read is an error that did
 * not happen, as far as they know.
 *
 * Status colour (build spec 4): red is the brand colour so red cannot mean
 * failure. Tone is encoded structurally — solid cherry rule for success,
 * dashed greige for error — always with a text label. No confetti.
 */

type Toast = { id: number; message: string; tone: 'success' | 'error' }
type ToastContext = { push: (message: string, tone?: Toast['tone']) => void }

const Ctx = createContext<ToastContext | null>(null)

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const AUTO_DISMISS_MS = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const { reduced } = useMotionPrefs()

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const schedule = useCallback(
    (id: number) => {
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
      )
    },
    [dismiss],
  )

  const pause = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const push = useCallback(
    (message: string, tone: Toast['tone'] = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, tone }])
      // Errors never auto-dismiss.
      if (tone === 'success') schedule(id)
    },
    [schedule],
  )

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div data-toast-stack className="pointer-events-none fixed bottom-0 z-70 flex w-full flex-col items-center gap-step-1 p-step-3 md:items-end">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <m.div
              key={toast.id}
              layout
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
              className="pointer-events-auto w-full max-w-sm border-l-2 bg-bordeaux px-step-3 py-step-2 text-sm text-vanilla shadow-xl"
              style={{
                borderLeftColor:
                  toast.tone === 'success' ? 'var(--color-cherry)' : 'var(--color-greige)',
                borderLeftStyle: toast.tone === 'success' ? 'solid' : 'dashed',
              }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16, ease: EASE.micro } }
              }
              transition={reduced ? { duration: 0 } : EASE.spring}
              onMouseEnter={() => toast.tone === 'success' && pause(toast.id)}
              onMouseLeave={() => toast.tone === 'success' && schedule(toast.id)}
              onFocus={() => toast.tone === 'success' && pause(toast.id)}
              onBlur={() => toast.tone === 'success' && schedule(toast.id)}
              tabIndex={0}
            >
              <span className="font-mono text-xs text-greige">
                {toast.tone === 'success' ? 'Done' : 'Not completed'}
              </span>
              <p className="mt-0.5">{toast.message}</p>
              {toast.tone === 'error' ? (
                <button
                  onClick={() => dismiss(toast.id)}
                  className="mt-step-1 text-xs underline decoration-greige underline-offset-2"
                >
                  Dismiss
                </button>
              ) : null}
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
