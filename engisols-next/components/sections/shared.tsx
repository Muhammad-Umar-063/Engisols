import type { ReactNode } from 'react'
import Link from 'next/link'
import { Band, BandHeading, Blocked, type Ground } from '@/components/layout/Band'
import { Reveal } from '@/components/motion/Reveal'
import { caseStudies, type CaseStudy } from '@/content/case-studies'
import { PRIMARY_CTA, SITE } from '@/lib/site'
import { team, trustMarkers } from '@/content/demo'

/**
 * Shared page blocks — content spec, "Shared blocks".
 *
 * These are roughly 40 of the ~102 section instances across the site. Built
 * once and imported; a per-page copy of any of them is a bug, because the whole
 * point is that the CTA, the FAQ shape and the case-study card look identical
 * everywhere and can be changed in one place.
 *
 * All server components. No 'use client' anywhere in this file — every word
 * here is sellable content and belongs in the first HTML response.
 */

/* ------------------------------------------------------------------ */
/* Page hero                                                            */
/* ------------------------------------------------------------------ */

/**
 * The top of every page except the homepage, which has its own scene.
 *
 * Deliberately plain: one line that says what the page is for. The homepage
 * hero is the only one carrying a montage and a capacity line.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  ground = 'bordeaux',
  children,
}: {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  ground?: Ground
  children?: ReactNode
}) {
  return (
    <Band ground={ground} className="pt-[calc(var(--spacing-step-6)+3rem)]">
      {eyebrow ? (
        <p className="font-mono text-xs tracking-tight text-current/60">{eyebrow}</p>
      ) : null}
      <h1 className="mt-step-3 max-w-[20ch] text-[clamp(2.25rem,5vw,4.5rem)]">{title}</h1>
      {lead ? <p className="measure mt-step-4 text-lg text-current/85">{lead}</p> : null}
      {children ? <div className="mt-step-5">{children}</div> : null}
    </Band>
  )
}

/* ------------------------------------------------------------------ */
/* CTA block — 12 templates                                             */
/* ------------------------------------------------------------------ */

/**
 * One line of tension, one primary CTA to the Build Audit, one secondary to
 * Contact. Copy varies per page context; the structure never does.
 */
export function CTABlock({
  line,
  ground = 'cherry',
}: {
  line: string
  ground?: Ground
}) {
  return (
    <Band ground={ground}>
      <Reveal>
        <h2 className="max-w-[22ch] text-[clamp(1.75rem,4vw,3.25rem)]">{line}</h2>
        <div className="mt-step-5 flex flex-wrap items-center gap-step-3">
          <Link
            href={PRIMARY_CTA.href}
            className="rounded-full bg-vanilla px-step-4 py-step-2 font-medium text-bordeaux no-underline transition-opacity hover:opacity-90"
          >
            {PRIMARY_CTA.label}
          </Link>
          <Link
            href="/contact"
            data-cursor="link"
            className="px-step-1 py-step-2 underline decoration-current/40 underline-offset-4 hover:decoration-current"
          >
            Or just talk to us first
          </Link>
        </div>
      </Reveal>
    </Band>
  )
}

/* ------------------------------------------------------------------ */
/* FAQ accordion — 6 templates                                          */
/* ------------------------------------------------------------------ */

export type FAQ = { q: string; a: string }

/**
 * Native `<details>`, not a JS accordion.
 *
 * Every answer is in the DOM, open or closed, so search engines and find-in-page
 * both see all of it. It also means the section works before hydration, which
 * matters because the awkward questions — cost, slippage, what happens if it
 * goes wrong — are the ones doing the selling.
 */
export function FAQAccordion({
  items,
  title = 'Questions people actually ask',
  ground = 'vanilla',
}: {
  items: FAQ[]
  title?: string
  ground?: Ground
}) {
  return (
    <Band ground={ground}>
      <BandHeading eyebrow="FAQ" title={title} />
      <div className="mt-step-5 max-w-3xl">
        {items.map((item) => (
          <details key={item.q} className="group border-t border-current/20 py-step-3">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-step-3 font-display text-lg">
              {item.q}
              <span
                aria-hidden
                className="mt-1 shrink-0 font-mono text-sm text-current/50 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="measure mt-step-2 text-current/80">{item.a}</p>
          </details>
        ))}
      </div>
    </Band>
  )
}

/* ------------------------------------------------------------------ */
/* Case study grid + related work — 5 templates                         */
/* ------------------------------------------------------------------ */

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  const metric = study.metrics[0]

  return (
    <Link
      href={`/work/${study.slug}`}
      className="group block no-underline"
      data-cursor="target"
    >
      <div className="aspect-4/3 overflow-hidden rounded-sm bg-bordeaux/10">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image lands
            with the asset pass; these are real screenshots at known sizes. */}
        <img
          src={study.imgSrc}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          style={{ transitionTimingFunction: 'var(--ease-enter)' }}
        />
      </div>
      <p className="mt-step-2 font-mono text-xs tracking-tight text-current/60">
        {study.category}
      </p>
      <h3 className="mt-step-1 font-display text-xl">{study.title}</h3>
      {metric ? (
        <p className="mt-step-1 text-sm text-current/75">
          <span className="font-display text-base tabular-nums">{metric.value}</span>{' '}
          {metric.label.toLowerCase()}
        </p>
      ) : null}
    </Link>
  )
}

export function CaseStudyGrid({
  studies = caseStudies,
  title = 'Selected work',
  lead,
  ground = 'vanilla',
  columns = 3,
}: {
  studies?: CaseStudy[]
  title?: string
  lead?: string
  ground?: Ground
  columns?: 2 | 3
}) {
  return (
    <Band ground={ground}>
      <BandHeading eyebrow="Work" title={title} lead={lead} />
      <ul
        className={`mt-step-5 grid gap-step-4 sm:grid-cols-2 ${
          columns === 3 ? 'lg:grid-cols-3' : ''
        }`}
      >
        {studies.map((study, i) => (
          <li key={study.slug}>
            <Reveal y={16} delay={i * 0.04}>
              <CaseStudyCard study={study} />
            </Reveal>
          </li>
        ))}
      </ul>
    </Band>
  )
}

/** Two others, excluding the one being read. */
export function RelatedWork({
  exclude,
  filter,
  title = 'Related work',
  ground = 'oat',
}: {
  exclude?: string
  filter?: (study: CaseStudy) => boolean
  title?: string
  ground?: Ground
}) {
  const pool = caseStudies.filter(
    (study) => study.slug !== exclude && (filter ? filter(study) : true),
  )
  const studies = (pool.length >= 2 ? pool : caseStudies.filter((s) => s.slug !== exclude)).slice(
    0,
    2,
  )

  return <CaseStudyGrid studies={studies} title={title} ground={ground} columns={2} />
}

/* ------------------------------------------------------------------ */
/* Proof strip — 4 templates                                            */
/* ------------------------------------------------------------------ */

export function ProofStrip({ ground = 'bordeaux' }: { ground?: Ground }) {
  return (
    <Band ground={ground} tight>
      <div className="flex flex-wrap items-center gap-x-step-5 gap-y-step-2">
        {trustMarkers.map((marker) => (
          <span key={marker} className="font-mono text-sm text-current/70">
            {marker}
          </span>
        ))}
      </div>
      <div className="mt-step-3 border-t border-current/20 pt-step-3">
        <Blocked marker="{{TODO: LOGOS}}" need="client logos cleared for public use" />
      </div>
    </Band>
  )
}

/* ------------------------------------------------------------------ */
/* Team row — 3 templates                                               */
/* ------------------------------------------------------------------ */

export function TeamRow({
  title = 'The three of you actually get',
  lead,
  ground = 'oat',
}: {
  title?: string
  lead?: string
  ground?: Ground
}) {
  return (
    <Band ground={ground}>
      <BandHeading eyebrow="The team" title={title} lead={lead} />
      <ul className="mt-step-5 grid gap-step-4 md:grid-cols-3">
        {team.map((person, i) => (
          <li key={person.name}>
            <Reveal y={16} delay={i * 0.06}>
              {/* Portraits deliberately omitted rather than stocked: a stock
                  face attached to a named engineer is the single most damaging
                  thing this site could ship. */}
              <div className="aspect-4/5 rounded-sm border border-current/20 bg-current/5" />
              <h3 className="mt-step-2 font-display text-xl">{person.name}</h3>
              <p className="font-mono text-xs tracking-tight text-current/60">{person.role}</p>
              <p className="measure mt-step-2 text-sm text-current/80">{person.bio}</p>
            </Reveal>
          </li>
        ))}
      </ul>
      <div className="mt-step-4">
        <Blocked marker="{{TODO: TEAM}}" need="three names, photos, one-line bios" />
      </div>
    </Band>
  )
}

/* ------------------------------------------------------------------ */
/* Scan capture — 6 templates                                           */
/* ------------------------------------------------------------------ */

/**
 * The low-commitment entry point. Sits below the paid CTA everywhere it
 * appears, never above it — it is the fallback for someone not ready to book,
 * not the primary action.
 */
export function ScanCapture({ ground = 'greige' }: { ground?: Ground }) {
  return (
    <Band ground={ground}>
      <div className="flex flex-col gap-step-4 md:flex-row md:items-end md:justify-between">
        <div>
          <BandHeading
            eyebrow="Free"
            title="Not ready to book anything?"
            lead="Point us at the repo and we will run a health scan — security, dependency risk, architecture, scalability and running cost. No call, no invoice."
          />
        </div>
        <Link
          href="/scan"
          className="shrink-0 rounded-full border border-current px-step-4 py-step-2 font-medium no-underline transition-colors hover:bg-current/10"
          data-cursor="target"
        >
          Run a free scan
        </Link>
      </div>
    </Band>
  )
}

/* ------------------------------------------------------------------ */
/* Small building blocks used across templates                          */
/* ------------------------------------------------------------------ */

/** Numbered commitments. Used by HowItWorks, Phases, HowWeWork. */
export function StepList({ steps }: { steps: { title: string; body: string; meta?: string }[] }) {
  return (
    <ol className="mt-step-5 grid gap-step-4 md:grid-cols-2">
      {steps.map((step, i) => (
        <li key={step.title} className="border-t border-current/20 pt-step-3">
          <div className="flex items-baseline gap-step-2">
            <span className="font-mono text-xs text-current/50">
              {String(i + 1).padStart(2, '0')}
            </span>
            {step.meta ? (
              <span className="font-mono text-xs text-current/60">{step.meta}</span>
            ) : null}
          </div>
          <h3 className="mt-step-1 font-display text-lg">{step.title}</h3>
          <p className="measure mt-step-2 text-sm text-current/80">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}

/** Two columns of plain statements. Used by WhoThisIsFor, WhenTheyWin/WhenWeWin. */
export function SplitList({
  left,
  right,
}: {
  left: { title: string; items: string[] }
  right: { title: string; items: string[] }
}) {
  return (
    <div className="mt-step-5 grid gap-step-5 md:grid-cols-2">
      {[left, right].map((column) => (
        <div key={column.title} className="border-t-2 border-current pt-step-3">
          <h3 className="font-display text-xl">{column.title}</h3>
          <ul className="mt-step-3 space-y-step-2">
            {column.items.map((item) => (
              <li key={item} className="measure text-current/80">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** Mono metadata table. Used by AtAGlance and the comparison pages. */
export function DataTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-step-4 grid gap-x-step-4 border-t border-current/20 sm:grid-cols-2">
      {rows.map(([term, value]) => (
        <div
          key={term}
          className="flex justify-between gap-step-3 border-b border-current/20 py-step-2"
        >
          <dt className="font-mono text-xs tracking-tight text-current/60">{term}</dt>
          <dd className="text-right font-mono text-xs">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Short paragraphs at reading measure. */
export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-step-4 space-y-step-3">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="measure text-lg text-current/85">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

/** A plain list of deliverables — things a client can point at. */
export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-step-4 grid gap-step-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-step-2 border-t border-current/20 pt-step-2">
          <span aria-hidden className="font-mono text-xs text-current/50">
            →
          </span>
          <span className="text-current/85">{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** Calendar embed slot. Real embed lands with the booking tool decision. */
export function Booking({ ground = 'vanilla' }: { ground?: Ground }) {
  return (
    <Band ground={ground} id="book">
      <BandHeading
        eyebrow="Booking"
        title="Pick a time"
        lead="A real calendar, not a contact form. You see the slot, you take it, you get a confirmation with the call link."
      />
      <div className="mt-step-5 rounded-sm border border-dashed border-current/40 p-step-5">
        <Blocked
          marker="{{TODO: BOOKING}}"
          need="calendar embed — Cal.com or Savvycal account, then the inline widget replaces this box"
        />
        <p className="measure mt-step-3 text-sm text-current/70">
          Until the embed lands, the fallback below is live and monitored.
        </p>
        <div className="mt-step-3 flex flex-wrap gap-step-3 font-mono text-sm">
          <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">
            {SITE.email}
          </a>
          <a
            href={`tel:${SITE.phone.replace(/\s/g, '')}`}
            className="underline underline-offset-4"
          >
            {SITE.phone}
          </a>
        </div>
      </div>
    </Band>
  )
}
