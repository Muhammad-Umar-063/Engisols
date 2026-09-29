'use client'

import { m, AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ConditionalField } from '@/components/motion/ConditionalField'
import { DotsMorphButton } from '@/components/motion/DotsMorphButton'
import { useToast } from '@/components/motion/Toast'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'
import { estimator } from '@/content/demo'
import { SITE } from '@/lib/site'
import { CheckIcon } from '@/components/ui/ActionIcons'

/**
 * Scope estimator — animation spec section 12, build spec section 7/11.
 *
 * 12.1: the trigger button MORPHS into the form panel via a shared layoutId —
 * it becomes the panel, it is not swapped for one. Inner content fades in on a
 * 120ms delay so it does not appear mid-morph. Focus moves to the first field
 * on expand, returns to the button on collapse, Escape collapses.
 *
 * Prepares a draft in the visitor's email app; it does not claim server delivery.
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
              className="site-choice"
              data-selected={selected}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span className="choice-marker" aria-hidden="true">{selected ? <CheckIcon /> : null}</span>
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
  const { reduced } = useMotionPrefs()
  const { push } = useToast()

  const hasOpened = useRef(false)
  // AnimatePresence mounts each end of the transition after the other exits.
  // Focus on attachment so it reaches the actual field/button, not a stale ref.
  const focusTrigger = useCallback((node: HTMLButtonElement | null) => {
    if (node && hasOpened.current) node.focus({ preventScroll: true })
  }, [])
  const focusFirstField = useCallback((node: HTMLFieldSetElement | null) => {
    node?.querySelector('input')?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!stage || !timeline || !budget || !email) return
    const body = `Project stage: ${stage}
Timeline: ${timeline}
Budget: ${budget}
Reply to: ${email}

Project details:
`
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Project scope inquiry')}&body=${encodeURIComponent(body)}`
    push('Email draft prepared. Send it from your email app to contact us.')
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!open ? (
        <m.button
          key="trigger"
          ref={focusTrigger}
          layoutId="estimator"
          transition={reduced ? { duration: 0 } : EASE.spring}
          onClick={() => { hasOpened.current = true; setOpen(true) }}
          className="site-button site-button-primary"
          style={{ transitionTimingFunction: 'var(--ease-micro)' }}
        >
          Prepare a project inquiry
        </m.button>
      ) : (
        <m.div
          key="panel"
          layoutId="estimator"
          transition={reduced ? { duration: 0 } : EASE.spring}
          className="w-full max-w-2xl rounded-xl border border-greige bg-vanilla p-step-3 sm:p-step-4"
        >
          {/* Content fades in after the morph is underway (120ms delay). */}
          <m.form
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.micro, delay: reduced ? 0 : 0.12 }}
            className="space-y-step-2"
          >
            <fieldset ref={focusFirstField} className="border-0 p-0">
              <Choice
                legend="What stage is your project at?"
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
                legend="What budget are you considering?"
                name="budget"
                options={estimator.budgets}
                value={budget}
                onChange={setBudget}
              />
            </ConditionalField>

            <ConditionalField show={budget !== null}>
              <label className="block">
                <span className="font-display text-lg">Your reply email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="site-field mt-step-2"
                  autoComplete="email"
                  name="email"
                />
              </label>
            </ConditionalField>

            <p className="text-sm text-bordeaux/70">Opens your email app with these details. Send the draft to complete your inquiry.</p>
            <div className="flex flex-wrap items-center gap-step-2 pt-step-2">
              <fieldset disabled={!stage || !timeline || !budget || !email}>
                <DotsMorphButton label="Open email draft" state="idle" />
              </fieldset>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="site-button site-button-outline"
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
