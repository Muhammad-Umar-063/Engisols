import { Band, Blocked } from '@/components/layout/Band'
import { PageHero } from '@/components/sections/shared'

/**
 * Legal shell — content spec section 17. Two sections each.
 *
 * Required for ad platforms and enterprise procurement, which is the entire
 * reason it exists at this stage. Written in plain language on purpose: these
 * pages get read by buyers doing diligence far more often than by lawyers.
 */
export function LegalPage({
  page,
}: {
  page: {
    title: string
    updated: string
    sections: { heading: string; body: string }[]
    blocker: string
  }
}) {
  return (
    <>
      <PageHero eyebrow={`Last updated ${page.updated}`} title={page.title} />

      <Band ground="vanilla">
        <div className="max-w-3xl">
          {page.sections.map((section) => (
            <div key={section.heading} className="border-t border-current/20 py-step-4">
              <h2 className="font-display text-xl">{section.heading}</h2>
              <p className="measure mt-step-2 text-current/85">{section.body}</p>
            </div>
          ))}
          <div className="mt-step-4">
            <Blocked marker={page.blocker.split(' — ')[0]} need={page.blocker.split(' — ')[1]} />
          </div>
        </div>
      </Band>
    </>
  )
}
