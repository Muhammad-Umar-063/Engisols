import type { FAQ } from '@/components/sections/shared'

/**
 * ⚠️  DEMO CONTENT — drafted, not signed off. See content/services.ts header.
 *
 * Content spec section 7: six industry pages, seven sections each.
 *
 * THE RULE THIS FILE BREAKS, DELIBERATELY AND TEMPORARILY. The spec says an
 * industry page ships only if there is at least one real case study in it,
 * because a vertical page with no evidence is worse than not having the page.
 * Only two of these six clear that bar today:
 *
 *   legal        SoloSuit         real
 *   saas         Alula, ProLyrics real
 *   real-estate  none             {{TODO: VERTICALS}}
 *   healthcare   none             {{TODO: VERTICALS}}
 *   construction none             {{TODO: VERTICALS}}
 *   payroll-hr   none             {{TODO: VERTICALS}}
 *
 * All six are built so the template can be reviewed at full length. The four
 * without evidence carry `evidenced: false` and render the blocker on the page
 * rather than quietly showing unrelated work. Do not publish those four.
 */

export type IndustryPage = {
  slug: string
  label: string
  /** False where no case study in this vertical exists yet. */
  evidenced: boolean
  /** Case study categories that count as evidence here. */
  evidence: string[]
  hero: { title: string; lead: string }
  problems: { title: string; body: string }[]
  whatWeBuild: string[]
  constraints: { title: string; body: string }[]
  faqs: FAQ[]
  cta: string
}

export const industries: IndustryPage[] = [
  {
    slug: 'legal',
    label: 'Legal',
    evidenced: true,
    evidence: ['Legal Tech'],
    hero: {
      title: 'Legal software fails on the edge cases, and in law the edge cases are the job.',
      lead: 'Jurisdiction rules, filing deadlines, document generation that has to be right the first time. We have shipped a platform that turns a court deadline into a flow a non-lawyer can complete.',
    },
    problems: [
      {
        title: 'Jurisdiction multiplies everything',
        body: 'A flow that works in one state needs rules, deadlines and document formats for the next fifty. Teams model this as configuration far too late, having hard-coded the first jurisdiction into the product.',
      },
      {
        title: 'Documents have to be exactly right',
        body: 'A generated filing with a wrong caption is not a bug report, it is a missed deadline with consequences. Generation needs review paths and audit trails, not just a template engine.',
      },
      {
        title: 'The user is frightened and not technical',
        body: 'People arrive at legal software under time pressure and in trouble. Interfaces that assume calm, informed users fail the actual audience.',
      },
      {
        title: 'Privilege and retention are load-bearing',
        body: 'Who can see a document, for how long, and what is logged about the access. Retrofitting this after launch means touching every query.',
      },
    ],
    whatWeBuild: [
      'Guided response flows that produce court-ready documents',
      'Jurisdiction rule engines with deadlines modelled as data, not code',
      'Attorney review queues with audit trails on every action',
      'Document generation with versioning and diffing',
      'Settlement and negotiation tooling',
      'Client intake that reads the file before a human does',
    ],
    constraints: [
      {
        title: 'Confidentiality and privilege',
        body: 'Access control designed in from the schema up, with logged access and defensible retention. Retrofitted permissions are the most common serious finding in a legal-tech audit.',
      },
      {
        title: 'Unauthorised practice of law',
        body: 'Product boundaries between information and advice are a design constraint, and they shape the interface, not just the terms of service.',
      },
      {
        title: 'Record retention',
        body: 'Retention windows vary by jurisdiction and matter type. Deletion has to be as reliable as storage, and provably so.',
      },
    ],
    faqs: [
      {
        q: 'Have you actually shipped legal software?',
        a: 'Yes — SoloSuit, a platform helping people respond to debt lawsuits across all fifty states, with guided flows, generated court documents and attorney review. The case study has the detail.',
      },
      {
        q: 'Can you work with our compliance counsel?',
        a: 'Yes, and the earlier the better. Compliance constraints that arrive after the data model is set are the expensive kind, and most of them are cheap if they arrive in week one.',
      },
      {
        q: 'How do you handle jurisdiction differences?',
        a: 'As data, with rules and deadlines in a structure that non-engineers can review and amend. The alternative — encoding them in application logic — makes every new jurisdiction an engineering project.',
      },
      {
        q: 'What about AI in a legal product?',
        a: 'Useful for drafting and triage, dangerous as an unreviewed authority. We build it with review paths and audit trails, and we will argue against shipping it anywhere a wrong answer is unrecoverable.',
      },
    ],
    cta: 'Building in legal tech and hitting the jurisdiction wall? We have been here.',
  },
  {
    slug: 'saas',
    label: 'SaaS',
    evidenced: true,
    evidence: ['SaaS Platform', 'AI & Automation'],
    hero: {
      title: 'The features shipped. The multi-tenancy, billing and permissions did not.',
      lead: 'The unglamorous middle of a SaaS product is where builds stall: tenant isolation, subscription states nobody mapped, and roles that were a boolean until the first enterprise deal.',
    },
    problems: [
      {
        title: 'Multi-tenancy decided too late',
        body: 'Tenant isolation is a schema decision. Retrofitting it means touching every query in the application, and it usually surfaces the week a customer asks a security question.',
      },
      {
        title: 'Billing states nobody modelled',
        body: 'Trials, upgrades, downgrades mid-cycle, failed payments, dunning, refunds. Each is a state, and the ones nobody modelled become support tickets and revenue leaks.',
      },
      {
        title: 'Roles that started as a boolean',
        body: 'is_admin works until the first customer wants three permission levels and an auditor. Then it is a migration across the whole product.',
      },
      {
        title: 'Onboarding is where churn happens',
        body: 'Most SaaS teams instrument the funnel and not the first session. The first ten minutes decide retention and are usually the least examined part of the product.',
      },
    ],
    whatWeBuild: [
      'Multi-tenant architecture with isolation you can demonstrate to a buyer',
      'Subscription and billing flows with the awkward states modelled',
      'Role and permission systems that survive an enterprise contract',
      'Usage metering and quota enforcement',
      'Admin tooling so support does not need an engineer',
      'Onboarding instrumented properly, so churn has a cause',
    ],
    constraints: [
      {
        title: 'Data isolation you can prove',
        body: 'Enterprise buyers ask how tenants are separated and expect a specific answer. "Every query filters by tenant" is not one, because it is a convention rather than a guarantee.',
      },
      {
        title: 'Security questionnaires',
        body: 'They arrive with the first serious deal and are half documentation of controls you already have. Knowing which half is real is the useful part.',
      },
    ],
    faqs: [
      {
        q: 'We are pre-revenue. Is multi-tenancy premature?',
        a: 'The schema decision is not, and it is nearly free to make correctly on day one. The tooling around it can wait. Getting this backwards is one of the most expensive avoidable mistakes in early SaaS.',
      },
      {
        q: 'Can you take over billing from Stripe Checkout?',
        a: 'Yes. The usual work is not the payment call, it is modelling the states around it — proration, failed payments, dunning, plan changes mid-cycle — which is where the revenue leaks are.',
      },
      {
        q: 'Do you have SaaS work we can look at?',
        a: 'Yes — Alula, a care coordination platform, and ProLyrics, an AI songwriting product with a real organic traffic figure attached. Both case studies are on the work page.',
      },
      {
        q: 'How long to get enterprise-ready?',
        a: 'It depends what the first enterprise buyer asks for, which is usually SSO, audit logs, role granularity and a security questionnaire. Assessed in an audit, that scope is typically four to eight weeks.',
      },
    ],
    cta: 'The features are done and the middle is missing. That is the normal shape of a stall.',
  },
  {
    slug: 'real-estate',
    label: 'Real estate',
    evidenced: false,
    evidence: [],
    hero: {
      title: 'Portfolio operations run on spreadsheets that three people understand.',
      lead: 'Units, tenants, maintenance, compliance dates and payments, spread across systems that were each bought to fix one of those and do not speak to the others.',
    },
    problems: [
      {
        title: 'The spreadsheet is the system of record',
        body: 'It works, it is fast, and exactly one person can maintain it. That person going on holiday is an operational risk nobody has written down.',
      },
      {
        title: 'Maintenance requests arrive everywhere',
        body: 'Phone, email, WhatsApp, a portal nobody uses. Response times cannot be measured because there is no single queue to measure.',
      },
      {
        title: 'Compliance dates are diary entries',
        body: 'Certificates, inspections, renewals. Tracked manually, remembered by individuals, and expensive precisely when missed.',
      },
    ],
    whatWeBuild: [
      'Portfolio dashboards that consolidate units, tenants and status',
      'Maintenance intake and routing from every channel into one queue',
      'Compliance calendars with escalation before a deadline, not after',
      'Owner and tenant portals with the right things visible to each',
      'Payment reconciliation against the accounting system',
    ],
    constraints: [
      {
        title: 'Tenant data protection',
        body: 'Personal data with clear retention obligations, and access that has to differ between owner, manager and contractor.',
      },
      {
        title: 'Legacy integrations',
        body: 'Property management platforms with limited or no API, where the honest answer is sometimes a scheduled export rather than a live integration.',
      },
    ],
    faqs: [
      {
        q: 'Can this connect to our existing property management software?',
        a: 'Usually. Where there is no usable API the practical answer is a scheduled export or a scraped report, and we will tell you plainly which one you are getting rather than promising a live integration that cannot exist.',
      },
      {
        q: 'Our team is not technical. Who maintains it?',
        a: 'You, with admin tooling designed for non-engineers, or us on a support arrangement. What we will not do is build something that requires an engineer to change a rule.',
      },
      {
        q: 'How long does something like this take?',
        a: 'A consolidated dashboard with one or two integrations is typically six to ten weeks. The integrations, not the interface, are what moves that number.',
      },
      {
        q: 'Do you have real estate work we can see?',
        a: 'Not yet published. We will not put a page up claiming domain evidence we cannot show — this page exists as a template while that is true.',
      },
    ],
    cta: 'If one spreadsheet going missing would stop your operation, that is worth fixing.',
  },
  {
    slug: 'healthcare',
    label: 'Healthcare',
    evidenced: false,
    evidence: [],
    hero: {
      title: 'Clinical software has to be right, auditable, and usable by someone mid-shift.',
      lead: 'Care coordination, intake and scheduling, built with the compliance constraints treated as architecture rather than a checklist at the end.',
    },
    problems: [
      {
        title: 'Compliance retrofitted is compliance rebuilt',
        body: 'Audit logging, access control and retention are schema-level decisions. Added after launch, they touch everything and delay the deal that triggered them.',
      },
      {
        title: 'Integration means HL7 or FHIR, or neither',
        body: 'Standards exist and adherence varies wildly by vendor. The integration surface is the risk in most clinical builds, and it is rarely scoped honestly.',
      },
      {
        title: 'The user is busy and interrupted',
        body: 'Software used mid-shift by someone with four other things happening cannot be designed for an unhurried demo.',
      },
    ],
    whatWeBuild: [
      'Care coordination and patient tracking tools',
      'Intake and triage flows with structured capture',
      'Scheduling that models real clinical constraints',
      'Audit logging designed in from the schema',
      'Integrations with clinical systems where the API is genuinely usable',
    ],
    constraints: [
      {
        title: 'HIPAA and equivalents',
        body: 'Access control, audit trails, encryption at rest and in transit, and business associate agreements. Load-bearing, and cheap only if designed in from the start.',
      },
      {
        title: 'Data residency',
        body: 'Where records physically live, which varies by market and sometimes by contract.',
      },
      {
        title: 'Clinical safety',
        body: 'There is a line between administrative tooling and anything influencing a clinical decision. We stay firmly on the administrative side of it.',
      },
    ],
    faqs: [
      {
        q: 'Are you HIPAA compliant?',
        a: 'Compliance belongs to the covered entity, not to a contractor, and any vendor claiming otherwise is telling you something imprecise. We build to the technical controls it requires and sign a BAA.',
      },
      {
        q: 'Can you integrate with our EHR?',
        a: 'Depends entirely on the vendor and the contract. Some expose a workable FHIR API, some expose a flat file overnight, and we will find out which you have before quoting rather than after.',
      },
      {
        q: 'Do you build anything clinical-facing?',
        a: 'Administrative and coordination tooling, yes. Anything that could influence a clinical decision needs a regulatory pathway and a different kind of team, and we will say so.',
      },
      {
        q: 'Do you have healthcare work we can see?',
        a: 'Nothing published in this vertical. We are not going to imply domain evidence we cannot show.',
      },
    ],
    cta: 'Compliance is cheapest when it is designed in. It is never cheaper later.',
  },
  {
    slug: 'construction',
    label: 'Construction',
    evidenced: false,
    evidence: [],
    hero: {
      title: 'The estimate takes a week and the margin is decided in that week.',
      lead: 'Takeoffs, bids, site reporting and change orders — the operational layer where a small accuracy gain moves the number that matters.',
    },
    problems: [
      {
        title: 'Takeoffs are slow and manual',
        body: 'A skilled estimator reading drawings for days. The bottleneck is real and directly limits how many jobs can be bid.',
      },
      {
        title: 'Change orders leak margin',
        body: 'Agreed verbally on site, documented later or never, disputed at invoice. The gap between the site and the system is where profit goes.',
      },
      {
        title: 'Site data arrives as photographs',
        body: 'Progress, delays and quality captured in a phone camera roll and a WhatsApp group, which cannot be reported on.',
      },
    ],
    whatWeBuild: [
      'Takeoff assistance that reads drawings and produces a reviewable quantity list',
      'Bid assembly with historical cost data attached',
      'Change order capture on site, with sign-off',
      'Progress reporting from structured site input',
      'Integrations with accounting and scheduling systems',
    ],
    constraints: [
      {
        title: 'Offline and low signal',
        body: 'Sites have poor connectivity. Anything used on site has to work offline and reconcile later, which is an architectural constraint rather than a feature.',
      },
      {
        title: 'Documents as the source of truth',
        body: 'Drawings and specifications are the contract. Version control on documents is load-bearing, and getting it wrong is expensive in a way software teams underestimate.',
      },
    ],
    faqs: [
      {
        q: 'Can AI do our takeoffs?',
        a: 'It can produce a reviewable first pass and save meaningful time. It cannot be trusted unreviewed, and any vendor telling you otherwise has not carried the risk of a wrong bid.',
      },
      {
        q: 'Our site teams will not use new software.',
        a: 'Correct, if it costs them time. Anything site-facing has to be faster than the WhatsApp message it replaces, offline-capable, and usable in gloves. That constraint drives the design.',
      },
      {
        q: 'Can it integrate with our accounting system?',
        a: 'Usually. The integration surface is the first thing we scope, because in this sector it is the part that most often turns out to be harder than the application.',
      },
      {
        q: 'Do you have construction work we can see?',
        a: 'Nothing published in this vertical yet.',
      },
    ],
    cta: 'If bidding is the bottleneck, that is a measurable problem with a measurable fix.',
  },
  {
    slug: 'payroll-hr',
    label: 'Payroll & HR',
    evidenced: false,
    evidence: [],
    hero: {
      title: 'Payroll is unforgiving: it is right, or it is a very bad Friday.',
      lead: 'Reconciliation, multi-jurisdiction rules and integrations with systems that will not change for you. Correctness is the whole product.',
    },
    problems: [
      {
        title: 'Reconciliation is manual and monthly',
        body: 'Someone compares three systems by hand under time pressure. It works until the month it does not, and that month is expensive and public.',
      },
      {
        title: 'Jurisdiction rules change without notice',
        body: 'Rates, thresholds and filing requirements move. Encoded in application logic, every change is a deployment.',
      },
      {
        title: 'Errors are discovered by employees',
        body: 'Which is the worst possible detection mechanism, and the reason trust is so hard to rebuild afterwards.',
      },
    ],
    whatWeBuild: [
      'Reconciliation that runs continuously and flags variance early',
      'Rules engines where rates and thresholds are data, not deployments',
      'Integrations with payroll providers and accounting systems',
      'Employee-facing self-service that reduces the query volume',
      'Audit trails detailed enough to answer a dispute months later',
    ],
    constraints: [
      {
        title: 'Correctness over throughput',
        body: 'A fast payroll system that is occasionally wrong has negative value. Every design tradeoff resolves toward provable correctness.',
      },
      {
        title: 'Personal and financial data',
        body: 'Access control, encryption and retention with real regulatory weight behind them.',
      },
      {
        title: 'Immovable integrations',
        body: 'Payroll providers do not adapt to you. Their API is the constraint and it shapes the build.',
      },
    ],
    faqs: [
      {
        q: 'Can you integrate with our payroll provider?',
        a: 'Depends on the provider, and it is the first thing we check. Some have workable APIs, some have a file drop, and one or two effectively have nothing — which changes what is possible before it changes the price.',
      },
      {
        q: 'How do you test something where errors are this expensive?',
        a: 'Parallel running against real historical periods until outputs match exactly, then continued shadow running after cutover. Nobody switches off the old process on a promise.',
      },
      {
        q: 'What about multi-country payroll?',
        a: 'Each jurisdiction is effectively a separate rule set, and the honest answer is that the second country costs nearly as much as the first. Anyone quoting otherwise has not built it.',
      },
      {
        q: 'Do you have payroll work we can see?',
        a: 'Nothing published in this vertical yet.',
      },
    ],
    cta: 'If reconciliation is manual and monthly, you already know the risk.',
  },
]

export function getIndustry(slug: string) {
  return industries.find((industry) => industry.slug === slug)
}
