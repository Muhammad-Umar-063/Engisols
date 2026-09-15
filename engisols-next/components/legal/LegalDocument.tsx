import Link from 'next/link'

import { Band } from '@/components/layout/Band'
import { PageHero } from '@/components/sections/shared'
import { SITE } from '@/lib/site'

export interface LegalDocumentData {
  title: string
  updated: string
  intro: string
  sections: Array<{
    heading: string
    paragraphs?: string[]
    items?: string[]
    contact?: boolean
  }>
  related: Array<{ label: string; href: string }>
}

export function LegalDocument({ page }: { page: LegalDocumentData }) {
  return (
    <>
      <PageHero
        eyebrow={`Last updated ${page.updated}`}
        title={page.title}
        lead={page.intro}
      >
        <nav aria-label="Related legal and service pages" className="flex flex-wrap gap-x-step-3 gap-y-step-2">
          {page.related.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs underline decoration-current/40 underline-offset-4 hover:decoration-current"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </PageHero>

      <Band ground="vanilla">
        <div className="grid gap-step-5 lg:grid-cols-[minmax(13rem,0.32fr)_minmax(0,1fr)] lg:items-start">
          <nav aria-label={`${page.title} sections`} className="lg:sticky lg:top-28">
            <p className="font-mono text-xs tracking-tight text-current/60">ON THIS PAGE</p>
            <ol className="mt-step-2 grid gap-step-1 sm:grid-cols-2 lg:grid-cols-1">
              {page.sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#${sectionId(section.heading)}`}
                    className="grid min-h-11 grid-cols-[2rem_minmax(0,1fr)] items-center gap-step-1 py-step-1 text-sm underline decoration-current/25 underline-offset-4 hover:decoration-current"
                  >
                    <span aria-hidden className="font-mono text-xs tabular-nums text-current/50">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{section.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 max-w-3xl">
            {page.sections.map((section) => (
              <section
                key={section.heading}
                id={sectionId(section.heading)}
                className="scroll-mt-28 border-t border-current/20 py-step-4 first:border-t-0 first:pt-0"
              >
                <h2 className="text-[clamp(1.45rem,3vw,2rem)]">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="measure mt-step-2 leading-relaxed text-current/85">
                    {paragraph}
                  </p>
                ))}
                {section.items ? (
                  <ul className="mt-step-3 space-y-step-2">
                    {section.items.map((item) => (
                      <li key={item} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-step-2 leading-relaxed text-current/85">
                        <span aria-hidden className="mt-[0.7em] size-1.5 rounded-full bg-current/55" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.contact ? (
                  <a
                    href={`mailto:${SITE.email}`}
                    className="mt-step-3 inline-flex min-h-11 items-center underline decoration-current/40 underline-offset-4 hover:decoration-current"
                  >
                    {SITE.email}
                  </a>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </Band>
    </>
  )
}

function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
