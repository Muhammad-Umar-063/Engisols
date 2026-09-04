/**
 * Copy for the AI App Audit landing page (/ai-app-audit).
 *
 * TRANSCRIBED FROM THE DESIGN, VERBATIM. Labels, casing and arrows are the
 * design's, including the ones the site's own build spec bans elsewhere —
 * all-caps letterspaced eyebrows and "→" on buttons. This is a campaign asset
 * matched to a supplied comp, not a page of the site, and the instruction is
 * that only the palette changes.
 *
 * Nothing here may link into the site. Where the design shows a link that would
 * have left — "Learn more", "View project", "View full report", the footer's
 * service names — the label stays exactly as drawn and the destination is on
 * this page: a disclosure, a dialog, or an anchor. The page looks like the comp
 * and cannot leave it.
 *
 * The audit panel's statuses are the design's resting values. Do not "improve"
 * them into clean passes; the comp shows three rows mid-review and two with
 * findings, and that is what ships.
 */

/**
 * Header nav, exactly the five items in the comp.
 *
 * The comp lists "What You Get" and "FAQ" but draws neither section, so those
 * two point at the nearest thing that does exist. They need either the missing
 * artboards or removal from the nav — see the note in the page component.
 */
export const lpNav = [
  { label: 'The Checks', href: '#checks' },
  { label: 'Our Work', href: '#work' },
  { label: 'How It Works', href: '#how' },
  { label: 'What You Get', href: '#how' },
  { label: 'FAQ', href: '#familiar' },
] as const

export const lpHero = {
  eyebrow: 'VIBE CHECK FOR AI-BUILT APPS',
  headline: 'YOUR AI APP LOOKS 80% DONE.',
  counter: 'The last 20% is where things get expensive.',
  lede: 'Built with Cursor, Claude, Lovable, Bolt, v0, Replit, or by a freelancer using the same tools?',
  body: 'The demo works. The screens look finished. Then real users arrive and the questions change.',
  questions: [
    'Is it secure?',
    'Can another engineer maintain it?',
    'What happens when it fails?',
    'Is the AI layer production-ready?',
    'Will it scale?',
  ],
  primary: 'BOOK A FREE SCOPING CALL',
  secondary: 'SEE THE CHECKS WE RUN',
  assurances: ['Free scoping call', 'Fixed-scope audit', 'Written report', 'No lock-in'],
}

export const lpAudit = {
  title: 'AI APP AUDIT',
  status: 'REVIEW IN PROGRESS',
  repoLabel: 'Repository',
  repo: 'your-app/main',
  rows: [
    { name: 'CODE QUALITY', detail: 'Reviewing structure & change risk', status: 'Reviewing' },
    { name: 'SECURITY', detail: 'Checking access & data boundaries', status: '2 Findings' },
    { name: 'RELIABILITY', detail: 'Tracing critical flows', status: 'Reviewing' },
    { name: 'ARCHITECTURE', detail: 'Reviewing bottlenecks', status: 'Reviewing' },
    { name: 'AI LAYER', detail: 'Checking models, tools & controls', status: '1 Finding' },
  ],
  prioritiesTitle: 'TOP PRIORITIES',
  priorities: [
    { rank: 1, label: 'Server-side authorization', severity: 'High' },
    { rank: 2, label: 'Missing retries on failures', severity: 'Medium' },
    { rank: 3, label: 'AI cost controls', severity: 'Medium' },
  ],
  report: 'View full report',
}

export const lpTools = {
  line: 'BUILT FAST WITH DIFFERENT TOOLS. SAME PRODUCTION QUESTIONS.',
  tools: ['Cursor', 'Claude', 'Lovable', 'Bolt', 'v0', 'Replit', 'Copilot'],
}

export const lpFamiliar = {
  eyebrow: 'SOUND FAMILIAR?',
  heading: 'The app works. You just don’t completely trust it.',
  quotes: [
    'Every quick fix creates two new problems.',
    'I don’t really know what’s in the codebase anymore.',
    'I’m scared to touch authentication.',
    'It worked fine with five users.',
    'The freelancer finished the app, but I’m just not sure how solid it is.',
    'The AI works, but I have no idea what it will cost at scale.',
  ],
  note: 'Those aren’t automatic reasons for a rewrite.',
  noteStrong: 'They are reasons to understand the system.',
  panel: {
    heading: 'Get clarity before you spend more.',
    points: ['No pressure', 'No sales pitch', 'Just a technical opinion'],
    cta: 'BOOK A SCOPING CALL',
  },
}

export const lpChecks = {
  eyebrow: 'THE FIVE CHECKS',
  heading: 'Five places fast-built apps usually get expensive.',
  lead: 'We review the areas most likely to become security, reliability, cost, scaling, or development problems later. If something is built well, we tell you that too.',
  more: 'Learn more',
  items: [
    {
      id: 'code-quality',
      n: '01',
      name: 'CODE QUALITY',
      question: 'Can another good engineer safely work here?',
      points: ['Structure & maintainability', 'Duplicated logic', 'Testing gaps', 'Change risk'],
    },
    {
      id: 'security',
      n: '02',
      name: 'SECURITY',
      question: 'Could someone access data or actions they shouldn’t?',
      points: [
        'Auth & authorization',
        'Secrets & sensitive data',
        'Ownership checks',
        'AI security risks',
      ],
    },
    {
      id: 'reliability',
      n: '03',
      name: 'RELIABILITY',
      question: 'What happens when the happy path breaks?',
      points: ['Errors & timeouts', 'Retries & duplicates', 'Webhooks & jobs', 'Monitoring & logs'],
    },
    {
      id: 'architecture',
      n: '04',
      name: 'ARCHITECTURE & SCALE',
      question: 'What happens if this actually takes off?',
      points: ['Database & queries', 'Bottlenecks', 'Infra & cost', 'Scaling limits'],
    },
    {
      id: 'ai-layer',
      n: '05',
      name: 'AI LAYER',
      question: 'Is the AI production-ready or still demo magic?',
      points: ['Models & prompts', 'RAG & agents', 'Cost controls', 'Reliability & evals'],
    },
  ],
}

export const lpWork = {
  eyebrow: 'OUR WORK',
  heading: 'We’ve worked on real software.',
  lead: 'AI products, SaaS, healthcare platforms, marketplaces, voice agents, and complex integrations.',
  view: 'View project',
  projects: [
    {
      name: 'GoZupees',
      initial: 'G',
      blurb: 'AI agents connected to real business workflows.',
      tags: ['AI Agents', 'RAG', 'Voice AI', 'APIs'],
    },
    {
      name: 'PastPresent',
      initial: 'P',
      blurb: 'From prototype to a real production product.',
      tags: ['SaaS', 'Next.js', 'Supabase', 'AI'],
    },
    {
      name: 'Genie Gets Me',
      initial: '✦',
      blurb: 'Personal AI built around user context.',
      tags: ['AI/ML', 'LLM', 'RAG', 'Personal AI'],
    },
    {
      name: 'MeetCaregivers',
      initial: '♥',
      blurb: 'Healthcare platform with complex workflows and marketplace.',
      tags: ['Healthcare', 'AI', 'Marketplace', 'RAG'],
    },
    {
      name: 'Account Lookup Agent',
      initial: '◎',
      blurb: 'Giving AI access with controlled permissions and security.',
      tags: ['AI Agent', 'Claude', 'Database', 'Security'],
    },
    {
      name: 'Retell AI + GHL',
      initial: '◈',
      blurb: 'Voice AI connected to real business workflows.',
      tags: ['Voice AI', 'API', 'Automation', 'Integration'],
    },
  ],
}

export const lpSteps = {
  eyebrow: 'HOW IT WORKS',
  heading: 'Three steps, then you know what you’re dealing with.',
  steps: [
    {
      n: '01',
      title: 'Scope it',
      body: 'Free call. Show us the product, where it is today and what worries you.',
      meta: 'Free scoping call',
    },
    {
      n: '02',
      title: 'We review it',
      body: 'Share repo, walkthrough and staging access. Engineers review. Tools assist.',
      meta: 'Human review, not a scan',
    },
    {
      n: '03',
      title: 'You get the plan',
      body: 'Written report + walkthrough. You know what to fix, what can wait, and what’s healthy.',
      meta: 'The report is yours',
    },
  ],
}

export const lpFinal = {
  heading: 'Stop finding out what’s broken from your users.',
  body: 'Your app already exists. Before you add more features, hire another developer, or send more users through it, understand what you’re building on top of.',
  points: ['Free scoping call', 'Fixed-scope audit', 'Written report', 'No obligation to hire us'],
  cta: 'BOOK A FREE SCOPING CALL',
}

export const lpFooter = {
  services: ['AI App Audits', 'AI Product Engineering', 'Product Rescue'],
  legal: [
    { label: 'Privacy', href: '/ai-app-audit/privacy' },
    { label: 'Terms', href: '/ai-app-audit/terms' },
  ],
  copyright: '© ENGISOLS',
}

/**
 * The booking dialog behind every CTA.
 *
 * Not drawn in the comp — the comp's buttons have no destination, and this page
 * may not send anyone to the site's /contact. A dialog keeps the page identical
 * to the comp until a visitor asks for it. Swap the whole thing for a calendar
 * embed the moment there is an account to embed.
 */
export const lpForm = {
  heading: 'Book a free scoping call',
  lead: 'Tell us what you built and what worries you. No deck, no pitch.',
  fields: {
    name: 'Your name',
    email: 'Work email',
    app: 'What did you build it with?',
    worry: 'What worries you most about it?',
  },
  submit: 'Request the call',
  done: 'Thanks — we will reply from a real address, usually within a working day.',
}
