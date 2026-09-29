/** Shared public-site content. Project metrics retain their case-study attribution. */
export const hero = {
  eyebrow: 'Software engineering',
  headline: 'Software engineering, from idea to production.',
  sub: 'AI systems, web products, automation, and cloud infrastructure. Bring us a new idea, an existing product, or a build that needs help.',
  primaryCta: { label: 'Discuss your project', href: '/contact' },
  secondaryCta: { label: 'See the work', href: '/work' },
  capacity: 'Build · Improve · Scale',
}

export const heroStats = [
  { value: '5', label: 'Published client projects' },
  { value: '5', label: 'Engineering services' },
  { value: 'Full stack', label: 'Applications and integrations' },
]

export const trustMarkers = ['AI & Agentic Systems', 'Product & MVP Build', 'Build Rescue', 'Automation & Integrations', 'Cloud & DevOps']

export const stall = {
  heading: 'What does your software need next?',
  lines: [
    'A new product, with a clear path from idea to launch.',
    'An AI feature that needs testing with real data.',
    'Less manual work between the tools you already use.',
    'A stalled build or infrastructure that needs attention.',
  ],
}

export const proof = [
  { value: '412K', label: 'ProLyrics monthly organic sessions' },
  { value: '96.2%', label: 'ProLyrics agent task success rate' },
  { value: '5', label: 'Published client projects' },
  { value: '5', label: 'Engineering services' },
]

export const process = [
  { title: 'Start with the problem', body: 'Describe what is blocked, what you have tried, and what a useful result would look like.' },
  { title: 'Agree the scope', body: 'Set out the proposed work, assumptions, deliverables, and costs before deciding to proceed.' },
  { title: 'Make progress visible', body: 'Choose a review cadence and a way to inspect working software together.' },
  { title: 'Plan the handover', body: 'Include documentation, operational ownership, and access requirements in the project scope.' },
]

/** Engineering disciplines, not placeholder staff identities. */
export const team = [
  { name: 'AI systems', role: 'Retrieval and automation', bio: 'Agent workflows, retrieval pipelines, and evaluation of generated output.' },
  { name: 'Product engineering', role: 'Applications and integrations', bio: 'Rails, React, and Next.js applications, from user flows to the APIs behind them.' },
  { name: 'Infrastructure', role: 'Deployment and operations', bio: 'Cloud environments, deployment pipelines, and operational visibility.' },
]

export const pricing = [
  { name: 'Build Audit', price: 'Scoped quote', cadence: 'Review scope agreed first', who: 'Understand an inherited or stalled build before committing to the next phase.', includes: ['Codebase and architecture review', 'Prioritised findings', 'Repair or rebuild options', 'Review of the proposed next steps'], featured: true },
  { name: 'Product Build', price: 'Project quote', cadence: 'Based on requirements and dependencies', who: 'Build a product or a defined part of one, with the deliverables and milestones agreed together.', includes: ['Product and technical scope', 'Implementation milestones', 'Testing and deployment plan', 'Handover requirements'], featured: false },
  { name: 'Ongoing Engineering', price: 'Custom scope', cadence: 'Capacity and cadence agreed together', who: 'Get engineering support for an existing product and an evolving roadmap.', includes: ['Prioritised backlog', 'Agreed engineering capacity', 'Progress reviews', 'Support and ownership boundaries'], featured: false },
]

export const estimator = {
  heading: 'Tell us where the build is.',
  sub: 'Three questions to prepare a project inquiry in your email app.',
  stages: ['Nothing built yet', 'Partly built, stalled', 'Live, needs work'],
  timelines: ['Within a month', '1–3 months', 'Flexible'],
  budgets: ['Under $15K', '$15K – $50K', '$50K+', 'Not sure yet'],
}
