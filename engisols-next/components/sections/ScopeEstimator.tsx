'use client'

import { m, AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ConditionalField } from '@/components/motion/ConditionalField'
import { DotsMorphButton } from '@/components/motion/DotsMorphButton'
import { useToast } from '@/components/motion/Toast'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'
import { estimator } from '@/content/demo'

/**
 * Scope estimator — animation spec section 12, build spec section 7/11.
 *
 * 12.1: the trigger button MORPHS into the form panel via a shared layoutId —
 * it becomes the panel, it is not swapped for one. Inner content fades in on a
 * 120ms delay so it does not appear mid-morph. Focus moves to the first field
 * on expand, returns to the button on collapse, Escape collapses.
 *
 * 12.3 sequencing: success shows the check for 900ms, THEN the toast fires and
 * the form closes.
 *
 * Three questions maximum. The answers are the point — this qualifies a lead
 * before a call. Spec 5 names it the one sanctioned client-only interaction.
 */

function Choice({
  legend,
  options,
  value,
  onChange,
  name,
}: {
  legend: string
  options: string[]
  value: string | null
  onChange: (v: string) => void
  name: string
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="font-display text-lg">{legend}</legend>
      <div className="mt-step-2 flex flex-wrap gap-step-1">
        {options.map((option) => {
          const selected = value === option
          return (
            <label
              key={option}
              className="cursor-pointer rounded-full border px-step-3 py-1.5 text-sm transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cherry"
              style={{
                borderColor: selected
                  ? 'var(--color-cherry)'
                  : 'color-mix(in srgb, var(--color-bordeaux) 35%, transparent)',
                background: selected ? 'var(--color-cherry)' : 'transparent',
                color: selected ? 'var(--color-vanilla)' : 'inherit',
                transitionTimingFunction: 'var(--ease-micro)',
              }}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function ScopeEstimator() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<string | null>(null)
  const [budget, setBudget] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const { reduced } = useMotionPrefs()
  const { push } = useToast()

  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstFieldRef = useRef<HTMLFieldSetElement>(null)

  // Focus management per 12.1: in on expand, back on collapse.
  //
  // Skip the mount run. `open` is false on first render, so without this guard
  // the effect takes the collapse branch on mount and focuses the trigger
  // button — and `focus()` scrolls its target into view. This section sits near
  // the foot of the page, so on every load the browser jumped the whole page
  // down to it before settling. Focus must only move in response to a real
  // expand/collapse the user drove, never on the initial render.
  const focusInitialized = useRef(false)
  useEffect(() => {
    if (!focusInitialized.current) {
      focusInitialized.current = true
      return
    }
    if (open) {
      firstFieldRef.current?.querySelector('input')?.focus()
    } else {
      triggerRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const reset = () => {
    setStage(null)
    setTimeline(null)
    setBudget(null)
    setEmail('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('pending')
    // DEMO: no endpoint wired. Replace with the real handler.
    await new Promise((r) => setTimeout(r, 1100))
    setState('done')
    // Spec 12.3: hold the check 900ms, then toast, then back to idle.
    setTimeout(() => {
      push('Thanks — you will get a scope and a range back, not a sales call.')
      setState('idle')
      setOpen(false)
      reset()
    }, 900)
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!open ? (
        <m.button
          key="trigger"
          ref={triggerRef}
          layoutId="estimator"
          transition={reduced ? { duration: 0 } : EASE.spring}
          onClick={() => setOpen(true)}
          className="rounded-2xl bg-cherry px-step-4 py-step-2 font-medium text-vanilla transition-opacity hover:opacity-90"
          style={{ transitionTimingFunction: 'var(--ease-micro)' }}
        >
          Start a scope estimate
        </m.button>
      ) : (
        <m.div
          key="panel"
          layoutId="estimator"
          transition={reduced ? { duration: 0 } : EASE.spring}
          className="max-w-2xl rounded-2xl border border-bordeaux/25 bg-vanilla p-step-4"
        >
          {/* Content fades in after the morph is underway (120ms delay). */}
          <m.form
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.micro, delay: reduced ? 0 : 0.12 }}
            className="space-y-step-2"
          >
            <fieldset ref={firstFieldRef} className="border-0 p-0">
              <Choice
                legend="Where is the build?"
                name="stage"
                options={estimator.stages}
                value={stage}
                onChange={setStage}
              />
            </fieldset>

            <ConditionalField show={stage !== null}>
              <Choice
                legend="When do you need it?"
                name="timeline"
                options={estimator.timelines}
                value={timeline}
                onChange={setTimeline}
              />
            </ConditionalField>

            <ConditionalField show={stage !== null && timeline !== null}>
              <Choice
                legend="Budget band?"
                name="budget"
                options={estimator.budgets}
                value={budget}
                onChange={setBudget}
              />
            </ConditionalField>

            <ConditionalField show={budget !== null}>
              <label className="block">
                <span className="font-display text-lg">Where do we send it?</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-step-2 w-full border-b border-bordeaux/30 bg-transparent py-step-1 outline-none placeholder:text-bordeaux/40 focus-visible:border-cherry"
                />
              </label>
            </ConditionalField>

            <div className="flex items-center gap-step-3 pt-step-2">
              <DotsMorphButton label="Send it" state={state} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm underline decoration-bordeaux/40 underline-offset-4"
              >
                Cancel
              </button>
            </div>
          </m.form>
        </m.div>
      )}
    </AnimatePresence>
  )
}
