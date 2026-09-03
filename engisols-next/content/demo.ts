/**
 * ⚠️  DEMO CONTENT — EVERY VALUE IN THIS FILE IS INVENTED.
 *
 * The build spec (section 3) forbids placeholder content precisely because
 * fabricated prices, client names and metrics on an engineering agency site are
 * worse than an empty section. That rule was waived deliberately so the design
 * can be reviewed with realistic copy in place.
 *
 * Consequences of that waiver, stated plainly:
 *
 *   MUST be replaced before this site is public
 *   ─────────────────────────────────────────
 *   PRICING    invented figures. Publishing a wrong price is a commercial
 *              problem, not a copy problem.
 *   TEAM       invented names and bios. These describe real people who do not
 *              exist as written. Photos are deliberately omitted rather than
 *              stock — a stock face attached to a named engineer is the single
 *              most damaging thing on this list.
 *   LOGOS      deliberately EMPTY. Naming clients you cannot name is a legal
 *              risk, not a design one, so this stays empty even in demo mode.
 *   PROOF      derived from the real case studies where possible; the two
 *              marked `invented: true` are not defensible and must go.
 *
 *   Safe to keep and edit at leisure
 *   ────────────────────────────────
 *   Section headings, service descriptions, process steps, the stall copy.
 *   These are positioning drafts, not claims of fact.
 *
 * Grep `DEMO` to find every consumer of this file.
 */

export const DEMO = true

/** {{TODO: POSITIONING}} — drafted toward Build Rescue, per spec recommendation. */
export const hero = {
  eyebrow: 'Senior engineering practice',
  headline: 'Three senior engineers for the build that stalled.',
  sub: 'No juniors, no account managers, no handoffs. We take on AI-native product work and the half-finished systems other teams walked away from.',
  primaryCta: { label: 'Book a Build Audit', href: '/pricing/build-audit' },
  secondaryCta: { label: 'See the work', href: '/work' },
  /** {{TODO: CAPACITY}} — invented. Real scarcity converts; fake scarcity is a lie. */
  capacity: 'Next build slot: November. 2 of 3 engineers allocated.',
}

/**
 * Hero stats row, carried over from the previous site's design.
 * All three are INVENTED — they were placeholders on the old site too.
 */
export const heroStats = [
  { value: '40+', label: 'Products shipped', invented: true },
  { value: '3', label: 'Senior engineers, no juniors', invented: false },
  { value: '9 yrs', label: 'Average experience', invented: true },
]

/** {{TODO: LOGOS}} — intentionally empty. See file header. */
export const trustLogos: { name: string; src: string }[] = []

export const trustMarkers = [
  'US, UK, EU, Australia, New Zealand and Saudi Arabia',
  'AWS Solutions Architect certified',
  '9 years average engineering experience',
]

/** Section 3 — the pain, in the buyer's words. Positioning draft, safe to edit. */
export const stall = {
  heading: 'The build is 70% done and it has been 70% done for four months.',
  lines: [
    'The AI feature works in the demo and falls over on real data.',
    'The contractor who understood the codebase left, and nobody has read it since.',
    'Every estimate comes back longer than the last one.',
    'You cannot tell whether the problem is the plan, the people, or the architecture.',
  ],
}

/**
 * Section 4 — proof band.
 *
 * The spec rule: real numbers only, and if no defensible metric exists the line
 * graph is deleted and static figures render instead. Two of these come from
 * the real ProLyrics dashboard. The two marked `invented` do not, and are the
 * reason the graph stays cut.
 */
export const proof = [
  { value: '412K', label: 'Monthly organic sessions delivered', invented: false },
  { value: '96.2%', label: 'Autonomous agent task success rate', invented: false },
  { value: '40+', label: 'Products shipped', invented: true },
  { value: '9 yrs', label: 'Average engineering experience', invented: true },
]

/** Section 8 — how we work. This is where the offshore-risk objection is won. */
export const process = [
  {
    title: 'You talk to the engineer building it',
    body: 'Not a project manager relaying messages. The person writing the code is the person on the call, from the first conversation to the last deploy.',
  },
  {
    title: 'Four hours of overlap, every working day',
    body: 'Fixed daily overlap with US Eastern and UK time. Async the rest, with written updates you can read instead of attend.',
  },
  {
    title: 'Your repo, your infrastructure, from day one',
    body: 'Code lands in your GitHub organisation and your cloud account. No staging environment we control and you cannot see.',
  },
  {
    title: 'IP assignment and NDA before any code is written',
    body: 'Signed up front. Everything produced is yours outright, with no licence-back clauses and no shared-ownership language.',
  },
  {
    title: 'If we go quiet, you keep everything',
    body: 'Documented handover, current architecture notes, and access you already hold. Walking away from us costs you nothing but time.',
  },
]

/** {{TODO: TEAM}} — invented names and bios. Photos omitted on purpose. */
export const team = [
  {
    name: 'Engineer One',
    role: 'AI systems',
    bio: 'RAG pipelines, agent orchestration, and the evaluation harnesses that keep them honest in production.',
    invented: true,
  },
  {
    name: 'Engineer Two',
    role: 'Product build',
    bio: 'Rails and Next.js product work, from first commit to the load that arrives after launch.',
    invented: true,
  },
  {
    name: 'Engineer Three',
    role: 'Infrastructure',
    bio: 'AWS Solutions Architect. Cloud, pipelines, and the boring reliability work nobody photographs.',
    invented: true,
  },
]

/** {{TODO: PRICING}} — INVENTED FIGURES. Do not publish. */
export const pricing = [
  {
    name: 'Build Audit',
    price: '$2,400',
    cadence: 'fixed, 10 working days',
    who: 'You have a stalled or inherited build and need to know what is actually wrong before committing to a direction.',
    includes: [
      'Full codebase and architecture review',
      'Prioritised remediation roadmap',
      'Written findings, not a slide deck',
      'Refunded in full if you proceed to a build',
    ],
    featured: true,
    invented: true,
  },
  {
    name: 'Product Build',
    price: '$18K – $70K',
    cadence: 'scoped per project',
    who: 'You know what you need built and want three seniors on it rather than a rotating bench.',
    includes: [
      'Fixed scope, fixed price, fixed date',
      'Weekly shipped increments',
      'Your repo and cloud from day one',
      'Handover documentation included',
    ],
    featured: false,
    invented: true,
  },
  {
    name: 'Embedded Retainer',
    price: 'from $9K',
    cadence: 'per month',
    who: 'You need ongoing senior capacity without carrying the hiring risk or the payroll.',
    includes: [
      'Dedicated engineer allocation',
      'Four hours daily overlap',
      'Roadmap and architecture input',
      'Thirty days notice, no lock-in',
    ],
    featured: false,
    invented: true,
  },
]

export const estimator = {
  heading: 'Tell us where the build is.',
  sub: 'Three questions. You get a written response with a scope and a range, not a sales call.',
  stages: ['Nothing built yet', 'Partly built, stalled', 'Live, needs work'],
  timelines: ['Within a month', '1–3 months', 'Flexible'],
  budgets: ['Under $15K', '$15K – $50K', '$50K+', 'Not sure yet'],
}
