/**
 * Navigation and route data — build spec section 9.
 *
 * Single source for the header, mega menu, footer and sitemap, so the four can
 * never disagree about what exists.
 */

export const SITE = {
  name: 'Engisols',
  url: 'https://www.engisols.com',
  email: 'growth@engisols.com',
  phone: '+1 971 365 1608',
  linkedin: 'https://www.linkedin.com/company/engisols/',
} as const

export type NavLink = { label: string; href: string; blurb?: string }

/** Five services. Order is a positioning decision — see TODO_POSITIONING. */
export const SERVICES: NavLink[] = [
  {
    label: 'AI & Agentic Systems',
    href: '/services/ai-engineering',
    blurb: 'RAG pipelines, agent workflows, and evals that survive production.',
  },
  {
    label: 'Product & MVP Build',
    href: '/services/product-build',
    blurb: 'Zero to shipped, with the architecture decisions made once.',
  },
  {
    label: 'Build Rescue',
    href: '/services/build-rescue',
    blurb: 'Stalled builds, inherited codebases, and the 70% that AI tools leave.',
  },
  {
    label: 'Automation & Integrations',
    href: '/services/automation',
    blurb: 'Workflows that remove headcount, not add dashboards.',
  },
  {
    label: 'Cloud & DevOps',
    href: '/services/cloud-devops',
    blurb: 'Infrastructure you can hand to someone else and they understand it.',
  },
]

/**
 * Six verticals. {{TODO: VERTICALS}} is NOT resolved by this list.
 *
 * The spec's rule stands: an industry page ships only if it has at least one
 * real case study in it. Today only `legal` and `saas` clear that bar, and
 * content/industries.ts marks the other four `evidenced: false` so the page
 * renders the blocker instead of implying evidence that does not exist. They
 * are listed here so the nav, the hub and the template can be reviewed at full
 * length — not because they are ready to publish.
 */
export const INDUSTRIES: NavLink[] = [
  {
    label: 'Legal',
    href: '/industries/legal',
    blurb: 'Jurisdiction rules, generated filings, and deadlines that cannot slip.',
  },
  {
    label: 'SaaS',
    href: '/industries/saas',
    blurb: 'Multi-tenancy, billing states and permissions that survive an enterprise deal.',
  },
  {
    label: 'Real estate',
    href: '/industries/real-estate',
    blurb: 'Portfolio operations that currently live in one spreadsheet.',
  },
  {
    label: 'Healthcare',
    href: '/industries/healthcare',
    blurb: 'Care coordination with compliance designed in, not retrofitted.',
  },
  {
    label: 'Construction',
    href: '/industries/construction',
    blurb: 'Takeoffs, bids and change orders that stop leaking margin.',
  },
  {
    label: 'Payroll & HR',
    href: '/industries/payroll-hr',
    blurb: 'Reconciliation and jurisdiction rules where correctness is the product.',
  },
]

export const HEADER_LINKS: NavLink[] = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/work' },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Process', href: '/process' },
]

/** Which header items open a mega menu rather than navigating directly. */
export const MEGA_MENU_LINKS = new Set(['/services', '/industries'])

export const PRIMARY_CTA = { label: 'Book a Build Audit', href: '/pricing/build-audit' } as const

export const COMPARE: NavLink[] = [
  { label: 'vs In-house hire', href: '/compare/in-house-hire' },
  { label: 'vs Offshore dev shop', href: '/compare/offshore-dev-shop' },
  { label: 'vs Upwork and Toptal', href: '/compare/upwork-toptal' },
  { label: 'vs AI coding tools', href: '/compare/ai-coding-tools' },
]

export const COMPANY: NavLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Process', href: '/process' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export const LEGAL: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]
