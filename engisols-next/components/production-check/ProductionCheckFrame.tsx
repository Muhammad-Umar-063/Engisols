import type { ReactNode } from 'react'

export function ProductionCheckFrame({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  children: ReactNode
}) {
  return (
    <section data-ground="light" className="min-h-[70dvh] bg-vanilla text-bordeaux">
      <div className="shell py-step-6 pt-[calc(var(--spacing-step-6)+3rem)] md:py-step-7 md:pt-[calc(var(--spacing-step-7)+2rem)]">
        <p className="font-mono text-xs tracking-tight text-current/60">{eyebrow}</p>
        <h1 className="mt-step-2 max-w-[18ch] text-[clamp(2.25rem,7vw,5rem)]">{title}</h1>
        {lead ? <p className="measure mt-step-3 text-lg text-current/80">{lead}</p> : null}
        <div className="mt-step-5">{children}</div>
      </div>
    </section>
  )
}
