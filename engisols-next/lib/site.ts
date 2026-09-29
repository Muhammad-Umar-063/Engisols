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

/** Five engineering services. */
export const SERVICES: NavLink[] = [
  {
    label: 'AI & Agentic Systems',
    href: '/services/ai-engineering',
    blurb: 'Retrieval, agent workflows, and evaluation on real data.',
  },
  {
    label: 'Product & MVP Build',
    href: '/services/product-build',
    blurb: 'Web products and MVPs, from scope to implementation.',
  },
  {
    label: 'Build Rescue',
    href: '/services/build-rescue',
    blurb: 'Review, repair, and move an existing codebase forward.',
  },
  {
    label: 'Automation & Integrations',
    href: '/services/automation',
    blurb: 'Connect your tools and reduce repetitive manual work.',
  },
  {
    label: 'Cloud & DevOps',
    href: '/services/cloud-devops',
    blurb: 'Cloud infrastructure, deployment pipelines, and monitoring.',
  },
]

/** Industry capabilities; published case studies are identified on each page. */
export const INDUSTRIES: NavLink[] = [
  {
    label: 'Legal',
    href: '/industries/legal',
    blurb: 'Legal workflows, document generation, and case management.',
  },
  {
    label: 'SaaS',
    href: '/industries/saas',
    blurb: 'Subscription products, billing, and tenant permissions.',
  },
  {
    label: 'Real estate',
    href: '/industries/real-estate',
    blurb: 'Property data, portfolio operations, and connected workflows.',
  },
  {
    label: 'Healthcare',
    href: '/industries/healthcare',
    blurb: 'Care coordination, access controls, and sensitive data workflows.',
  },
  {
    label: 'Construction',
    href: '/industries/construction',
    blurb: 'Estimating, bids, project tracking, and change orders.',
  },
  {
    label: 'Payroll & HR',
    href: '/industries/payroll-hr',
    blurb: 'Payroll reconciliation, approvals, and employee workflows.',
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

export const PRIMARY_CTA = { label: 'Start a project', href: '/contact' } as const

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
  { label: 'Free app check', href: '/scan' },
  { label: 'Contact', href: '/contact' },
]

export const LEGAL: NavLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]
