/**
 * Copy for the AI App Audit landing page (/ai-app-audit).
 *
 * The campaign's content source of truth. Labels and section order preserve the
 * supplied composition; form copy and interaction labels are maintained here
 * so the sealed funnel stays consistent.
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
 * Header nav — the comp's five items, each now pointing at a section that
 * actually exists.
 *
 * The comp listed "What You Get" and "FAQ" and drew neither, so both used to
 * resolve to the nearest thing that did exist. A nav item that scrolls
 * somewhere unrelated is worse than one that is missing: the reader learns the
 * nav is decorative and stops using it. Both sections are written now.
 */
export const lpNav = [
  { label: 'The Checks', href: '#checks' },
  { label: 'Our Work', href: '#work' },
  { label: 'How It Works', href: '#how' },
  { label: 'What You Get', href: '#report' },
  { label: 'FAQ', href: '#faq' },
] as const

export const lpHero = {
  eyebrow: 'VIBE CHECK FOR AI-BUILT APPS',
  headline: 'YOUR AI APP LOOKS 80% DONE.',
  counter: 'The last 20% is where things get expensive.',
  lede: 'Built with Cursor, Claude, Lovable, Bolt, v0, Replit, or by a freelancer using the same tools?',
  body: 'The demo works. The screens look finished. Then real users arrive and the questions change.',
  /**
   * Six, not the comp's five. The grid is two columns, so five left a hole in
   * the last cell and the block read as unfinished next to the CTA row beneath
   * it. The sixth is the page's own language — the cost question is the one
   * the quotes section already raises ("no idea what it will cost at scale") —
   * and it maps to a check that exists, so it is a gap being closed rather
   * than a claim being added.
   */
  questions: [
    'Is it secure?',
    'Can another engineer maintain it?',
    'What happens when it fails?',
    'Is the AI layer production-ready?',
    'Will it scale?',
    'What will it cost at scale?',
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

/**
 * The tool strip. Marks are the vendors' own, pulled from their sites and
 * normalised to 128px squares in public/logos/tools — the comp shows real
 * logos, and a row of seven typeset names is a different design.
 *
 * These stay in their own colours. They are third-party marks: repainting them
 * in the palette would be both wrong and, for several of them, a trademark
 * problem. The palette's job here is the chip they sit in.
 */
export const lpTools = {
  line: 'BUILT FAST WITH DIFFERENT TOOLS. SAME PRODUCTION QUESTIONS.',
  tools: [
    { name: 'Cursor', icon: '/logos/tools/cursor.svg' },
    { name: 'Claude', icon: '/logos/tools/claude.png' },
    { name: 'Lovable', icon: '/logos/tools/lovable.png' },
    { name: 'Bolt', icon: '/logos/tools/bolt.svg' },
    { name: 'v0', icon: '/logos/tools/v0.svg' },
    { name: 'Replit', icon: '/logos/tools/replit.png' },
    { name: 'Copilot', icon: '/logos/tools/copilot.svg' },
    { name: 'Windsurf', icon: '/logos/tools/windsurf.png' },
    { name: 'Gemini', icon: '/logos/tools/gemini.png' },
    { name: 'Codex', icon: '/logos/tools/codex.png' },
    { name: 'Cline', icon: '/logos/tools/cline.png' },
    { name: 'Kiro', icon: '/logos/tools/kiro.png' },
  ],
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
      points: [
        'Structure & maintainability',
        'Duplicated logic',
        'Testing gaps',
        'Change risk',
        'Dependency health',
        'Dead code & drift',
        'Naming & conventions',
        'Error handling',
      ],
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
        'Input validation',
        'Rate limits & abuse',
        'Dependency CVEs',
      ],
    },
    {
      id: 'reliability',
      n: '03',
      name: 'RELIABILITY',
      question: 'What happens when the happy path breaks?',
      points: [
        'Errors & timeouts',
        'Retries & duplicates',
        'Webhooks & jobs',
        'Monitoring & logs',
        'Data consistency',
        'Recovery & rollback',
        'Idempotency',
        'Timeout budgets',
        'Alerting',
      ],
    },
    {
      id: 'architecture',
      n: '04',
      name: 'ARCHITECTURE & SCALE',
      question: 'What happens if this actually takes off?',
      points: [
        'Database & queries',
        'Bottlenecks',
        'Infra & cost',
        'Scaling limits',
        'Caching strategy',
        'Background work',
        'State & sessions',
        'Third-party limits',
        'Deploy & rollback',
      ],
    },
    {
      id: 'ai-layer',
      n: '05',
      name: 'AI LAYER',
      question: 'Is the AI production-ready or still demo magic?',
      points: [
        'Models & prompts',
        'RAG & agents',
        'Cost controls',
        'Reliability & evals',
        'Guardrails & fallbacks',
        'Latency & caching',
        'Context & memory',
        'Tool permissions',
        'Output validation',
      ],
    },
  ],
}

/**
 * Work.
 *
 * All six are real clients with real marks, fetched from their own sites and
 * normalised to 128px squares in public/logos. They keep their own colours:
 * recolouring a client's logo to match a palette is the one thing a logo may
 * never do.
 *
 * SoloSuit replaced the Account Lookup Agent, which was the one entry with no
 * company behind it — an internal engineering piece, so no mark to fetch and
 * nothing for a visitor to recognise. SoloSuit is a shipped product with its
 * own brand and its own case study on the site; its copy here is condensed from
 * that entry rather than written fresh.
 *
 * `initial` stays on every entry as the fallback for a mark that fails to load.
 */
export const lpWork = {
  eyebrow: 'OUR WORK',
  heading: 'We’ve worked on real software.',
  lead: 'AI products, SaaS, healthcare platforms, marketplaces, voice agents, and complex integrations.',
  view: 'View project',
  projects: [
    {
      name: 'GoZupees',
      initial: 'G',
      logo: '/logos/gozupees.png',
      image: '/work-lp/gozupees.jpg',
      blurb: 'AI agents connected to real business workflows.',
      tags: ['AI Agents', 'RAG', 'Voice AI', 'APIs'],
      summary:
        'Real-time voice and chat agents for service-heavy businesses — telecom, insurance, housing, recruitment — handling inbound calls and omni-channel conversations rather than answering FAQs in a widget.',
      built: [
        'Agent orchestration wired into the systems the business already runs on',
        'Retrieval built to be inspected, so an answer can be traced to its source',
        'Voice and chat sharing one conversation model rather than two codebases',
      ],
    },
    {
      name: 'PastPresent',
      initial: 'P',
      logo: '/logos/pastpresent.png',
      image: '/work-lp/pastpresent.jpg',
      blurb: 'From prototype to a real production product.',
      tags: ['SaaS', 'Next.js', 'Supabase', 'AI'],
      summary:
        'Stories and photos from everyone who knows a person, turned into a hardcover tribute book. The product worked but did not scale: every extra contributor added manual editorial effort, writing quality varied, people were missed, and inappropriate submissions could reach print.',
      built: [
        'An agentic pipeline that drafts and edits contributions, grounded by RAG in what people actually wrote',
        'Moderation before print, because the failure mode is a physical book',
        'Zero apps for contributors — they write where they already are',
      ],
      facts: [
        { value: '5', label: 'Occasion types supported' },
        { value: 'Zero', label: 'Apps for contributors' },
      ],
    },
    {
      name: 'Genie Gets Me',
      initial: '✦',
      logo: '/logos/genie.svg',
      image: '/work-lp/genie.jpg',
      imageAnchor: 'center' as const,
      blurb: 'Personal AI built around user context.',
      tags: ['AI/ML', 'LLM', 'RAG', 'Personal AI'],
      summary:
        'A personal assistant whose whole value is context: memories, tastes, people and the connected accounts around them. The engineering question is not the model — it is what gets stored, what gets retrieved, and what the model is allowed to see.',
      built: [
        'A memory layer with retrieval that stays useful past the first thousand entries',
        'Explicit boundaries on what personal context reaches a prompt',
        'Cost per active user treated as a design constraint, not a surprise',
      ],
    },
    {
      name: 'MeetCaregivers',
      initial: '♥',
      logo: '/logos/meetcaregivers.png',
      image: '/work-lp/meetcaregivers.jpg',
      blurb: 'Healthcare platform with complex workflows and marketplace.',
      tags: ['Healthcare', 'AI', 'Marketplace', 'RAG'],
      summary:
        'An in-home senior care marketplace: matching caregivers to families, plus staffing for hospitals and care communities. Two-sided marketplace mechanics on top of healthcare workflows, where who may see what is the product rather than a feature of it.',
      built: [
        'Matching and scheduling across a nationwide caregiver network',
        'Ownership and access checks enforced server-side, not in the interface',
        'Workflows that survive the messy cases — cancellations, replacements, partial shifts',
      ],
    },
    {
      name: 'SoloSuit',
      initial: 'S',
      logo: '/logos/solosuit.png',
      image: '/work-lp/solosuit.jpg',
      blurb: 'Legal AI that helps people answer debt lawsuits on their own.',
      tags: ['Legal Tech', 'Rails', 'RAG', 'AI Agents'],
      summary:
        'Sued over a debt, you have 14 to 30 days to file a formal response. Miss it and the court enters a default judgment — the case is lost without ever being argued. Most people miss it, because the alternative is a lawyer they cannot afford or a legal document they do not know how to write.',
      built: [
        'A guided flow that compiles a valid response and generates the court documents',
        'Attorney review in the loop, because the output goes to a court',
        'Settlement tooling for what happens after the response is filed',
      ],
      facts: [
        { value: '$2.99B', label: 'Debt protected on platform' },
        { value: '393K', label: 'People helped' },
        { value: '50', label: 'US states covered' },
      ],
    },
    {
      name: 'Retell AI + GHL',
      initial: '◈',
      logo: '/logos/retell.png',
      logoSecondary: '/logos/ghl.png',
      image: '/work-lp/retell.jpg',
      blurb: 'Voice AI connected to real business workflows.',
      tags: ['Voice AI', 'API', 'Automation', 'Integration'],
      summary:
        'Voice agents joined to a CRM, where the interesting engineering is never the call itself. It is the retry, the duplicate, the webhook that arrives twice, and the record that must not end up in two states.',
      built: [
        'Call outcomes written back to the CRM idempotently',
        'Webhook handling that survives redelivery and out-of-order events',
        'Failure paths that hand back to a human instead of dropping the lead',
      ],
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
      body: 'A free call. Show us the product, where it is today, and the part that worries you most. No prep needed.',
      meta: 'Free scoping call',
      time: '30 minutes',
    },
    {
      n: '02',
      title: 'We review it',
      body: 'Share the repo, a walkthrough and staging access. Engineers read the code. Tools assist, they do not decide.',
      meta: 'Human review, not a scan',
      time: 'Fixed scope',
    },
    {
      n: '03',
      title: 'You get the plan',
      body: 'A written report and a walkthrough call. You know what to fix, what can wait, and what is already healthy.',
      meta: 'The report is yours',
      time: 'Yours to keep',
    },
  ],
}

/**
 * What you get — the section the nav has always promised.
 *
 * Built from the deliverable the page already describes in step 03 rather than
 * from new claims: a written report, ordered by consequence, that says what to
 * fix, what can wait and what is fine, and a call to read it with you.
 */
export const lpReport = {
  eyebrow: 'WHAT YOU GET',
  heading: 'A report you could hand to another engineer.',
  lead: 'Plain language, ordered by what it costs you to ignore. Yours to keep whether or not you ever work with us.',
  items: [
    {
      title: 'Findings, ranked',
      body: 'Every issue with a severity, where it lives, and what it actually risks — not a linter dump of 400 warnings with no priority.',
    },
    {
      title: 'What to fix, what can wait',
      body: 'The split that makes the report usable. Some of what we find is worth a sprint. Some is worth knowing and leaving alone.',
    },
    {
      title: 'What is already healthy',
      body: 'Named explicitly. If the auth model is sound or the schema is right, you should stop worrying about it and spend the attention elsewhere.',
    },
    {
      title: 'A walkthrough call',
      body: 'We read it with you, so it is a conversation your team can ask questions in rather than a PDF nobody opens twice.',
    },
  ],
}

/**
 * FAQ — the questions that actually arrive, in the words they arrive in.
 *
 * Every one of these is a fear rather than a request for information, which is
 * why the answers lead with the fear instead of the feature. They are the same
 * anxieties the quotes section opens with, answered where a reader has just
 * finished deciding whether to book.
 */
export const lpFaq = {
  eyebrow: 'FAQ',
  heading: 'The questions people ask before they book.',
  items: [
    {
      q: 'Are you going to tell me to rebuild the whole thing?',
      a: 'Usually not. Most of what we find is fixable in place, and a rewrite is the most expensive answer to a question nobody has framed yet. If a rebuild genuinely is the cheaper path we will say so and show the working — including what it would cost you to keep going instead.',
    },
    {
      q: 'I am not technical. Will I understand the report?',
      a: 'Yes — that is the point of it. Every finding says what it risks in business terms before it says anything about code, and we read it with you on a call. If you have a developer or an agency, the same report is written to be handed straight to them.',
    },
    {
      q: 'What if it turns out my app is fine?',
      a: 'Then the report says so, section by section. Being told the thing you were nervous about is sound is a real outcome, and it is what makes the rest of the findings worth believing. We are not paid more for finding problems.',
    },
    {
      q: 'The person who built it has gone. Is that a problem?',
      a: 'It is the normal case, not the hard one. Most of what we review was written by someone who is no longer available — an AI tool, a contractor, a founder who has moved on. Reading a codebase cold is the job.',
    },
    {
      q: 'Do I have to give you access to everything?',
      a: 'Read access to the repository, a walkthrough, and staging if you have one. Nothing is written, nothing is deployed, and no production data is needed. The scoping call before that needs no access at all.',
    },
    {
      q: 'Am I going to be sold something on the call?',
      a: 'No. The scoping call exists to work out whether an audit is even the right next move for you — sometimes it is not, and we will tell you that rather than sell you one. Fixed scope, no lock-in, and no obligation to hire us afterwards.',
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
 * The same-route dialog behind every primary CTA. It qualifies the request with
 * enough context for an engineer to respond usefully, without making visitors
 * leave the campaign or open a local mail client.
 */
export const lpForm = {
  heading: 'Book a free scoping call',
  lead: 'Tell us what you built and what you need to trust before launch. A senior engineer will read this before replying.',
  fields: {
    name: 'Your name',
    email: 'Work email',
    app: 'App URL or product name',
    worry: 'What should we investigate first?',
  },
  submit: 'Send to an engineer',
  done: 'Request received. A senior engineer will reply within one working day.',
}
