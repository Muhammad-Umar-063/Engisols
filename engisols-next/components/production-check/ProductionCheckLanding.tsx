import { ToolStrip } from '@/components/campaign/ToolStrip'
import { Card, Eyebrow, LpSection } from '@/components/campaign/ui'
import { Reveal } from '@/components/motion/Reveal'

const checkCards = [
  {
    n: '01',
    title: 'PUBLIC APP SURFACE',
    body: 'We inspect public pages, browser code, response headers, and supported credential patterns.',
  },
  {
    n: '02',
    title: 'DATA AND ADMIN SIGNALS',
    body: 'We look for browser-side data access, administrative routes, webhooks, and supported stack signals.',
  },
  {
    n: '03',
    title: 'CODE REVIEW NEEDED',
    body: 'We name the private controls that still require source access, including authorization and database policies.',
  },
] as const

const faq = [
  {
    q: 'Do I need to connect GitHub?',
    a: 'No. This check reads only the same public HTML, headers, and browser code that a normal visitor can receive.',
  },
  {
    q: 'Will public frontend keys be called leaks?',
    a: 'No. Supabase anon keys and Stripe publishable keys can be normal. We classify supported public configuration as EXPECTED.',
  },
  {
    q: 'Does this prove my app is production-ready?',
    a: 'No public scan can do that. The report separates observed public exposure from the controls that still need source-code review.',
  },
] as const

export function ProductionCheckLanding() {
  return (
    <>
      <section className="border-y border-greige/40 bg-vanilla">
        <div className="shell flex flex-col gap-step-3 py-step-3 lg:flex-row lg:items-center lg:gap-step-4">
          <Reveal y={8} className="shrink-0">
            <p className="max-w-[25ch] font-mono text-[0.65rem] leading-relaxed tracking-[0.08em] text-bordeaux/75">
              BUILT FAST WITH DIFFERENT TOOLS. SAME PRODUCTION QUESTIONS.
            </p>
          </Reveal>
          <Reveal y={8} delay={0.06} className="min-w-0 flex-1">
            <ToolStrip />
          </Reveal>
        </div>
      </section>

      <LpSection id="checks" ground="oat">
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <Reveal y={16}>
            <Eyebrow>WHAT IT CHECKS</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(2rem,4vw,3.5rem)]">A public check that knows where public evidence ends.</h2>
            <p className="measure mt-step-3 text-bordeaux/80">See what the public app exposes, then separate visible evidence from controls that require source access.</p>
          </Reveal>
          <div className="grid gap-step-2 md:grid-cols-3">
            {checkCards.map((item, index) => (
              <Reveal key={item.n} y={16} delay={index * 0.06} className="h-full">
                <Card className="h-full">
                  <span className="font-mono text-xs text-bordeaux/55">{item.n}</span>
                  <h3 className="mt-step-3 font-mono text-sm tracking-[0.06em]">{item.title}</h3>
                  <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/80">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </LpSection>

      <LpSection id="how">
        <Reveal y={16}>
          <Eyebrow>HOW IT WORKS</Eyebrow>
          <h2 className="mt-step-3 max-w-[22ch] text-[clamp(2rem,4vw,3.5rem)]">Paste the live app. Watch the check. Keep the report.</h2>
        </Reveal>
        <ol className="mt-step-5 grid gap-step-2 md:grid-cols-3">
          {[
            ['01', 'Paste your URL', 'No login, repository connection, or installation.'],
            ['02', 'We inspect the public surface', 'Real scanner phases and bounded bundle analysis—not a fake progress timer.'],
            ['03', 'Get a prioritized report', 'FIX NOW, REVIEW, and EXPECTED findings in plain founder language.'],
          ].map(([n, title, body], index) => (
            <li key={n}>
              <Reveal y={16} delay={index * 0.06} className="h-full">
                <Card className="h-full">
                  <span className="grid size-9 place-items-center rounded-full bg-oat/70 font-mono text-xs">{n}</span>
                  <h3 className="mt-step-3 text-xl">{title}</h3>
                  <p className="mt-step-2 text-sm leading-relaxed text-bordeaux/80">{body}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
      </LpSection>

      <LpSection id="meaning" ground="oat">
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Reveal y={16}>
            <Eyebrow>WHAT THE LABELS MEAN</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(2rem,4vw,3.5rem)]">Attention without alarm.</h2>
          </Reveal>
          <div className="grid gap-step-2 sm:grid-cols-3">
            <Card>
              <p className="font-mono text-xs text-bordeaux/60">FIX NOW</p>
              <p className="mt-step-2 font-display text-xl">A supported privileged exposure was observed publicly.</p>
            </Card>
            <Card>
              <p className="font-mono text-xs text-bordeaux/60">REVIEW</p>
              <p className="mt-step-2 font-display text-xl">A public signal needs source-code or policy verification.</p>
            </Card>
            <Card>
              <p className="font-mono text-xs text-bordeaux/60">EXPECTED</p>
              <p className="mt-step-2 font-display text-xl">Public client configuration that can be normal by design.</p>
            </Card>
          </div>
        </div>
      </LpSection>

      <LpSection id="faq">
        <div className="grid gap-step-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Reveal y={16}>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-step-3 text-[clamp(2rem,4vw,3.5rem)]">Before you run it.</h2>
          </Reveal>
          <div>
            {faq.map((item) => (
              <details key={item.q} className="group border-t border-greige/60 py-step-3 last:border-b">
                <summary className="flex cursor-pointer list-none justify-between gap-step-3 font-display text-lg">
                  {item.q}
                  <span aria-hidden className="shrink-0 text-cherry transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
                </summary>
                <p className="measure mt-step-2 text-bordeaux/80">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </LpSection>

      <section data-ground="dark" className="bg-cherry text-vanilla on-dark">
        <div className="shell grid gap-step-4 py-step-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <Reveal y={16}>
            <h2 className="max-w-[20ch] text-[clamp(2rem,4vw,3.5rem)]">Check your live app before more users depend on it.</h2>
            <p className="measure mt-step-3 text-vanilla/90">The report takes about 12 seconds and does not require login or source-code access.</p>
          </Reveal>
          <Reveal y={8} delay={0.08}>
            <a href="#tool" className="inline-flex min-h-12 items-center rounded-full bg-vanilla px-step-4 font-mono text-sm font-medium text-cherry no-underline">
              CHECK MY APP <span aria-hidden className="ml-2">→</span>
            </a>
          </Reveal>
        </div>
      </section>
    </>
  )
}
