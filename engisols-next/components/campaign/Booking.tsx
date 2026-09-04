'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Magnetic } from '@/components/motion/Magnetic'
import { SheetModal } from '@/components/motion/SheetModal'
import { DotsMorphButton } from '@/components/motion/DotsMorphButton'
import { useToast } from '@/components/motion/Toast'
import { lpForm } from '@/content/campaign'
import { SITE } from '@/lib/site'

/**
 * Every CTA on the page, and the dialog behind them.
 *
 * The comp's buttons have no destination drawn, and the two obvious ones are
 * both closed off: /contact is on the site, which this page may not reach, and
 * there is no calendar account to embed yet. A dialog is the only answer that
 * leaves the page pixel-identical to the comp — nothing is added to the layout,
 * the form exists only once someone asks for it — while keeping the conversion
 * on the page the ad paid for.
 *
 * One provider, one dialog, many buttons: the CTA appears four times in the
 * comp and they must all do the same thing.
 *
 * NOTHING IS WIRED. Submit runs the simulated round trip the site's scope
 * estimator uses. The live route is the email in the dialog. Replace `submit`
 * with the real handler, or swap the whole dialog for the calendar embed,
 * before this runs as an ad — a campaign that pays for clicks into a form that
 * posts nowhere is the worst outcome available here.
 */

const BookingCtx = createContext<(() => void) | null>(null)

/** Opens the dialog. Any client component under the provider may call it. */
export function useBooking() {
  const open = useContext(BookingCtx)
  if (!open) throw new Error('CTA rendered outside <BookingProvider>')
  return open
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])

  return (
    <BookingCtx.Provider value={show}>
      {children}
      <SheetModal open={open} onClose={() => setOpen(false)} title={lpForm.heading}>
        <BookingForm />
      </SheetModal>
    </BookingCtx.Provider>
  )
}

/**
 * The CTA. `variant` matches the three treatments the comp draws.
 *
 * The magnetic field is INSIDE the component, not at the call sites. The button
 * appears four times — header, hero, the clarity panel, the closing band — and
 * a pull that only some of them have reads as a bug rather than as emphasis.
 * `-m-6` cancels the field's own padding so the surrounding layout does not
 * move; `snap={false}` keeps the cursor a dot on it, because a button already
 * shows its own shape and covering it hides the label.
 */
export function BookButton({
  label,
  variant = 'primary',
  className = '',
}: {
  label: string
  variant?: 'primary' | 'inverse' | 'compact'
  className?: string
}) {
  const open = useBooking()

  const style =
    variant === 'inverse'
      ? 'bg-vanilla text-cherry'
      : variant === 'compact'
        ? 'bg-cherry text-vanilla'
        : 'bg-cherry text-vanilla'

  const size = variant === 'compact' ? 'px-step-3 py-2 text-xs' : 'px-step-4 py-step-2 text-sm'

  return (
    <Magnetic className="-m-6" snap={false}>
      <button
        type="button"
        onClick={open}
      // The cursor takes its fill from the nearest `[data-ground]`, and a
      // button is a surface of its own: a cherry fill sitting on a light page
      // is dark ground for the few pixels it covers, and without this the
      // cursor paints bordeaux on bordeaux and disappears the moment it is over
      // the thing it is pointing at. The inverse variant is the same rule
      // running the other way.
      data-ground={variant === 'inverse' ? 'light' : 'dark'}
      // No `data-cursor`. The cursor's own rule: `link` is for a run of text,
      // which has no shape of its own to show, and covering a button says
      // nothing a reader cannot already see — it just hides the label under a
      // slab. On a CTA the cursor stays a dot and `Magnetic` does the talking.
      className={`inline-flex items-center gap-2 rounded-full font-mono font-medium tracking-tight whitespace-nowrap transition-opacity hover:opacity-90 ${style} ${size} ${className}`}
      style={{ transitionTimingFunction: 'var(--ease-micro)' }}
    >
        {label}
        <span aria-hidden>→</span>
      </button>
    </Magnetic>
  )
}

function BookingForm() {
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle')
  const { push } = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('pending')
    // DEMO: no endpoint wired. Replace with the real handler.
    await new Promise((r) => setTimeout(r, 1100))
    setState('done')
    // Spec 12.3: hold the check 900ms, then toast, then back to idle.
    setTimeout(() => {
      push(lpForm.done)
      setState('idle')
    }, 900)
  }

  return (
    <form onSubmit={submit} className="space-y-step-3 text-bordeaux">
      <p className="text-sm text-bordeaux/75">{lpForm.lead}</p>

      <div className="grid gap-step-3 sm:grid-cols-2">
        <Field id="lp-name" label={lpForm.fields.name} autoComplete="name" />
        <Field id="lp-email" label={lpForm.fields.email} type="email" autoComplete="email" />
      </div>
      <Field
        id="lp-app"
        label={lpForm.fields.app}
        placeholder="Cursor, Lovable, a freelancer…"
      />
      <Field id="lp-worry" label={lpForm.fields.worry} multiline />

      <div className="flex flex-wrap items-center gap-step-3 pt-step-1">
        <DotsMorphButton label={lpForm.submit} state={state} />
        <p className="font-mono text-xs text-bordeaux/60">
          Or email{' '}
          <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
            {SITE.email}
          </a>
        </p>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  multiline = false,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
  multiline?: boolean
}) {
  const shared =
    'mt-step-1 w-full border-b border-bordeaux/25 bg-transparent py-step-1 outline-none transition-colors placeholder:text-bordeaux/40 focus-visible:border-cherry'

  return (
    <label htmlFor={id} className="block">
      <span className="font-mono text-xs tracking-tight text-bordeaux/70">{label}</span>
      {multiline ? (
        <textarea id={id} name={id} rows={3} placeholder={placeholder} className={shared} />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={shared}
        />
      )}
    </label>
  )
}
