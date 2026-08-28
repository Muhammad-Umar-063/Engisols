// Centralized case study data — used by CaseStudiesSection (cards) and CaseStudyDetailPage.
// Keep slugs URL-safe and stable; they appear in routes (/case-studies/:slug) and the sitemap.

export const caseStudies = [
  {
    slug: 'solosuit-legal-ai-platform',
    title: 'SoloSuit',
    category: 'Legal Tech',
    shortDescription:
      'Legal AI that helps people answer debt lawsuits on their own — guided response flows, generated court documents, attorney review, and settlement tooling.',
    tagline:
      'Most people sued over debt never respond, and lose by default. This platform turns a court deadline into a guided flow anyone can complete.',
    imgSrc: '/solosuit.png',
    // Light-background screenshot — see `imgTone` handling in the banner.
    imgTone: 'light',
    iconName: 'Scale',
    metrics: [
      { value: '$2.99B', label: 'Debt Protected on Platform' },
      { value: '393K', label: 'People Helped' },
      { value: '50', label: 'US States Covered' },
      { value: '3', label: 'Products in the Suite' },
    ],
    overview:
      'When someone is sued over a debt, they have 14 to 30 days to file a formal response. Miss it and the court enters a default judgment — the case is lost without ever being argued. Most people miss it, because the alternative is hiring a lawyer they cannot afford or drafting a legal document they do not know how to write. SoloSuit closes that gap with software: a guided flow that compiles a valid response, generates the court documents, routes them to an attorney for review, and handles filing. ENGISOLS worked on the platform as an AI and senior software engineer.',
    challenges: [
      'The deadline is unforgiving and short — the flow has to take someone from panic to a filed response inside days, not weeks.',
      'Users are non-lawyers under stress, often facing their first court document, so every step has to be legible without legal training.',
      'Procedure and document requirements vary across all 50 states, and a response valid in one may be defective in another.',
      'AI in a legal context cannot improvise. A hallucinated defence or citation is not a bad answer, it is a filing that fails.',
      'The product must stay firmly on the correct side of a hard line: it provides legal information and document automation, never legal advice.',
      'Debt settlement runs a different flow entirely — negotiation with creditors rather than court procedure — inside the same product.',
    ],
    solution: [
      {
        heading: 'Platform — Ruby on Rails + React',
        body:
          'A Rails backend carrying case state, document generation, and the attorney review pipeline, with React front ends for the guided response flow. The step-by-step structure exists to break an intimidating legal document into questions a person can actually answer one at a time.',
      },
      {
        heading: 'Legal AI — ChatGPT API Integration',
        body:
          'AI assistance built on the ChatGPT API for legal and financial questions, integrated so it supports users inside the flow rather than sitting off to the side as a chatbot. Retrieval keeps responses anchored to real procedural information instead of generated guesses.',
      },
      {
        heading: 'Agentic Workflows',
        body:
          'Agent-driven workflows moving a case through its stages — intake, response compilation, document generation, attorney handoff, and filing — so the user experiences one continuous flow rather than a series of disconnected forms.',
      },
      {
        heading: 'Document Generation',
        body:
          'Court-ready documents assembled from user answers against the requirements of the relevant jurisdiction, then routed for attorney review before filing so a human signs off on what reaches the court.',
      },
      {
        heading: 'Settlement Tooling',
        body:
          'A parallel path for users who would rather settle than litigate, supporting negotiated payoffs below face value with the fee structure calculated against the settled amount.',
      },
    ],
    results: [
      'A guided path to a filed lawsuit response for people who would otherwise default by doing nothing.',
      'Court-ready documents generated from plain-language answers, with attorney review before filing.',
      'Coverage across all 50 US states, each with its own procedural requirements.',
      'The platform reports $2.99B in debt protected across 393,000 people helped.',
      'Legal defence brought within reach of people priced out of hiring counsel.',
    ],
    techStack: [
      'Ruby on Rails',
      'React',
      'OpenAI',
      'RAG',
      'AI Agents',
    ],
  },
  {
    slug: 'pastpresent-memory-platform',
    title: 'PastPresent',
    category: 'Agentic AI',
    shortDescription:
      'An agentic AI pipeline that turns crowdsourced memories and photos into a printed tribute book — grounded by RAG, moderated before print, invisible by design.',
    tagline:
      'Turning scattered memories from dozens of contributors into one printed keepsake — where the automation has to stay invisible for the book to feel handmade.',
    imgSrc: '/pastpresent.jpeg',
    // Light-background screenshot — needs a heavier banner scrim than the dark
    // ones, or the white hero washes out the overlaid title.
    imgTone: 'light',
    iconName: 'BookOpen',
    metrics: [
      { value: '5', label: 'Occasion Types Supported' },
      { value: 'RAG', label: 'Grounded in Real Memories' },
      { value: 'Zero', label: 'Apps for Contributors' },
      { value: 'Pre-Print', label: 'Automated Moderation' },
    ],
    overview:
      'PastPresent collects stories and photos from everyone who knows a person — for a memorial, birthday, wedding, graduation, or anniversary — and turns them into a hardcover tribute book. The product worked, but it did not scale: every additional contributor added manual editorial effort. Writing quality varied wildly between contributors, people got missed, layouts suffered, and inappropriate submissions could reach print. ENGISOLS led the technical side as CTO and built the AI backbone end to end.',
    challenges: [
      'Editorial effort scaled linearly with contributors — every extra person meant more manual writing, chasing, and layout work.',
      'Contributions arrive in wildly different registers, from a two-line message to a long reminiscence, and the book has to read as one coherent volume.',
      'Levelling the writing risks flattening it — the whole point is that each entry still sounds like the person who wrote it.',
      'Generic AI writing invents details. For a memorial book, a plausible-but-false memory is not a glitch, it is a serious failure.',
      'Submissions are unmoderated and the output is physically printed, so inappropriate content has to be caught before it becomes permanent.',
      'Photos arrive unsorted across decades and have to be arranged into something that reads as designed rather than dumped.',
    ],
    solution: [
      {
        heading: 'Grounding — RAG Over Each Person\'s Memories',
        body:
          'Retrieval-augmented generation scoped to the individual honouree, so every generated line is anchored to details contributors actually submitted. The model works from a real corpus of that person\'s life rather than generating plausible filler — the difference between a book that moves a family and one that quietly gets things wrong.',
      },
      {
        heading: 'Agentic Pipeline',
        body:
          'An agent pipeline carries a submission from raw contribution to print-ready page: interpreting what was sent, levelling the prose, placing it in the book, and handing off to layout. Each stage is a distinct step rather than one monolithic prompt, so quality problems can be isolated and fixed.',
      },
      {
        heading: 'Voice-Preserving Editing',
        body:
          'The editing pass raises the floor without flattening the ceiling. Grammar, structure, and pacing get levelled so a two-line note sits comfortably beside a long reminiscence, while the phrasing and character of each contributor survive the edit.',
      },
      {
        heading: 'Photo Curation',
        body:
          'Automatic photo arrangement across the book, curating by theme and time period so images land near the stories they belong to instead of being dropped in submission order.',
      },
      {
        heading: 'Moderation Before Print',
        body:
          'A moderation stage screens submissions before anything reaches print. Because the artefact is physical and often commemorative, this runs as a hard gate rather than a post-hoc flag.',
      },
      {
        heading: 'Infrastructure — AWS Amplify',
        body:
          'The platform runs on AWS Amplify, covering the contributor-facing submission flow, the organiser dashboard, and the pipeline behind them.',
      },
    ],
    results: [
      'Editorial effort decoupled from contributor count — adding people no longer adds proportional manual work.',
      'Stories stay factually grounded in what contributors actually wrote, not model invention.',
      'Contributors need no account, app, or payment to take part — an invitation link is enough.',
      'Inappropriate content is caught before print rather than discovered in a finished book.',
      'The automation is deliberately invisible: the finished book reads as though it was assembled by hand.',
    ],
    techStack: [
      'AWS Amplify',
      'RAG',
      'AI Agents',
    ],
  },
  {
    slug: 'prolyrics-ai-songwriting-saas',
    title: 'ProLyrics.ai',
    category: 'AI & Automation',
    shortDescription:
      'An AI songwriting SaaS rebuilt for growth — Rails product, usage-aware CRM, and an autonomous SEO agent running a daily content operation with no headcount.',
    tagline:
      'A songwriting platform with no organic acquisition and a CRM blind to product usage — rebuilt into a self-running growth engine.',
    imgSrc: '/prolyrics.jpeg',
    iconName: 'Brain',
    metrics: [
      { value: '412K', label: 'Monthly Organic Sessions' },
      { value: '96.2%', label: 'Agent Task Success Rate' },
      { value: '126', label: 'Hours Saved by Automation' },
      { value: '7.2', label: 'Avg. Search Position' },
    ],
    overview:
      'ProLyrics is a professional songwriting platform used by writers working with major labels. It had two structural problems that had nothing to do with the product itself: no organic acquisition channel, and a CRM that could not see what users actually did inside the app — so lifecycle messaging fired on calendar timers rather than behaviour. ENGISOLS built the Rails application, wired product events into the CRM, and then built an autonomous SEO agent that now runs the entire content operation without dedicated headcount.',
    challenges: [
      'Growth depended entirely on paid and direct traffic — there was no organic acquisition channel to compound over time.',
      'The CRM had no visibility into product usage, so trial, upgrade, and churn messaging could not respond to what a user had actually done.',
      'The songwriting tools query very large reference datasets — 70,000 idioms and 3,000 genre phrases — and still have to feel instant while a writer is mid-line.',
      'A content operation at real SEO scale normally needs dedicated headcount the business did not have.',
      'Content had to rank in classic search and also surface inside AI answer engines, which retrieve and cite very differently.',
    ],
    solution: [
      {
        heading: 'Product — Ruby on Rails',
        body:
          'The core application: a rhyme engine covering perfect, near, and slant rhymes plus mouth-shape matches; an idea generator for lyric starters and emotional angles; genre and idiom libraries; and an open-ended AI assistant for exploring themes and connections.',
      },
      {
        heading: 'Performance — Caching Over Large Datasets',
        body:
          'The reference libraries are far too large to query naively on every keystroke. A caching layer over the hot paths keeps lookups responsive, so the tools stay usable at the speed someone actually writes.',
      },
      {
        heading: 'Monetization — Subscription Tiering',
        body:
          'Tiered subscriptions gating feature access across Starter, Pro, and Enterprise plans, with entitlement checks threaded through the tools rather than bolted on at the edges.',
      },
      {
        heading: 'CRM — Behaviour-Triggered Lifecycle',
        body:
          'Signup, trial, upgrade, and churn events synced from the product into GoHighLevel, turning the CRM from a static contact list into something that reacts to real usage. Nurture sequences now fire on what a user did, not how long ago they registered.',
      },
      {
        heading: 'Growth — Autonomous n8n SEO Agent',
        body:
          'An autonomous agent handling the full content loop end to end: daily keyword research, brief generation, drafting, schema markup, internal link mapping, and publishing. It targets classic search alongside answer-engine, generative-engine, and AI optimization, so content is retrievable by both crawlers and AI assistants.',
      },
    ],
    results: [
      '412,860 organic sessions in a 30-day window, up 18.4% on the previous period.',
      'Average search position improved to 7.2, a gain of 2.1 positions.',
      '1,204 agent tasks completed at a 96.2% success rate, with 99.4% agent uptime.',
      '3,846 pages indexed across 3,239 tracked keywords, 214 of them added by the agent.',
      '126 hours of manual work saved — the content operation now runs daily with no dedicated headcount.',
    ],
    techStack: [
      'Ruby on Rails',
      'Ruby',
      'n8n',
      'GoHighLevel',
    ],
  },
  {
    slug: 'quick-sync-privacy-platform',
    title: 'Quick Sync',
    category: 'Web3 Platform',
    shortDescription:
      'A privacy-first decentralized collaboration platform — encrypted file sharing, anonymous live Q&A, and a developer framework for building privacy dApps.',
    tagline:
      'Building a privacy-first collaboration platform where sessions are ephemeral, encryption is the default, and no account is ever required.',
    imgSrc: '/quicksync.jpeg',
    iconName: 'ShieldCheck',
    metrics: [
      { value: '3', label: 'dApps in the Suite' },
      { value: 'Zero', label: 'Accounts Required' },
      { value: 'E2E', label: 'Encrypted by Default' },
      { value: 'P2P', label: 'Waku + WebRTC Delivery' },
    ],
    overview:
      'Quick Sync is a decentralized collaboration platform built on the principle that privacy is a right, not a privilege. Rather than bolting encryption onto a conventional SaaS product, the platform treats ephemeral sessions and end-to-end encryption as the default state — users share files, run live Q&A, and collaborate without creating an account, and without the platform ever holding readable data. ENGISOLS worked across the stack: responsive interfaces, secure API routes, database operations, and third-party integrations, contributing to the QS Share and StageX dApps alongside the marketplace and token layer.',
    challenges: [
      'Privacy had to be structural, not a setting — the interface needed to work with no account, no persistent storage, and no server-side access to user content.',
      'Sessions are ephemeral by design, so the UI had to communicate expiring state and key exchange clearly without exposing users to cryptographic complexity.',
      'Content delivery spans two very different paths — live peer-to-peer transfer and decentralized buckets for offline recipients — behind one consistent interface.',
      'StageX required real-time anonymous Q&A with voting and moderation, where participation is untraceable but abuse still has to be controllable.',
      'The marketplace and token layer needed wallet-connected flows to sit alongside the no-account path without fragmenting the product into two separate experiences.',
    ],
    solution: [
      {
        heading: 'Front End — Next.js + TypeScript',
        body:
          'Responsive, animation-led interfaces built in TypeScript, covering the platform surface and both flagship dApps. The design language leans on motion to make invisible cryptographic state legible — session lifecycles, key establishment, and expiry are surfaced as interface feedback rather than technical detail the user has to interpret.',
      },
      {
        heading: 'API Layer — Secure Server Routes',
        body:
          'Secure API routes handling the operations that cannot run client-side, deliberately scoped so encrypted payloads pass through without the server holding keys or readable content. External service integrations sit behind this layer rather than being called directly from the client.',
      },
      {
        heading: 'Data — Prisma-Backed Persistence',
        body:
          'Database operations through Prisma for the metadata the platform legitimately needs — channel lifecycles, marketplace listings, and dApp records — kept strictly separate from user content, which never lands in a readable form.',
      },
      {
        heading: 'dApps — QS Share and StageX',
        body:
          'QS Share delivers ephemeral, end-to-end encrypted file sharing across invitation-only, link-based, and public access modes. StageX brings real-time anonymous Q&A to live sessions and X Spaces, with community voting and moderation tooling that works without identifying participants.',
      },
      {
        heading: 'Monetization — Marketplace + Token',
        body:
          'Interface work for the QS Marketplace, where developers list privacy dApps, and the $QS token integration underpinning creator monetization and on-chain revenue sharing.',
      },
    ],
    results: [
      'Three privacy dApps shipped on a shared framework — QS Share and StageX live, FileXchange in development.',
      'Full platform functionality reachable with no account and no wallet, keeping the privacy promise intact at the entry point.',
      'A single interface spanning both peer-to-peer and decentralized-bucket delivery, so users never have to reason about transport.',
      'Framework surface documented and opened to external developers, with APIs and SDKs supporting third-party privacy apps.',
    ],
    techStack: [
      'Next.js',
      'React',
      'TypeScript',
      'Prisma',
      'PostgreSQL',
      'Node.js',
      'WebRTC',
      'Web3',
    ],
  },
  {
    slug: 'alula-care-platform',
    title: 'Alula',
    category: 'SaaS Platform',
    shortDescription:
      'A family caregiving command centre — shared CareSpaces, task boards, encrypted document vaults, and health record integration for distributed care teams.',
    tagline:
      'A caregiving coordination platform where scattered family care teams share one source of truth — tasks, calendars, health records, and encrypted documents.',
    imgSrc: '/alula.png',
    iconName: 'HeartPulse',
    metrics: [
      { value: '7', label: 'Care Modules Shipped' },
      { value: 'AES-256', label: 'Document Encryption' },
      { value: '6', label: 'Secure Vault Categories' },
      { value: 'MyChart', label: 'Health Records Integration' },
    ],
    overview:
      'Alula is a caregiving coordination platform built for families managing complex care — dementia, Parkinson\'s, long-term illness — where responsibility is split across relatives, professional caregivers, and clinicians who rarely occupy the same room. The product replaces the usual sprawl of group chats, shared drives, and paper folders with a single CareSpace per recipient. ENGISOLS delivered the full web platform: the marketing site, the care dashboards, and the API layer behind them.',
    challenges: [
      'Care teams mix family members and professional caregivers with very different permissions over deeply sensitive medical and financial records.',
      'The interface had to stay legible to non-technical family members under stress, while still exposing tasks, scheduling, documents, and health data.',
      'Document storage holds passports, wills, bank details, and medical history — encryption and access control were requirements, not features.',
      'Scheduling spans time zones and recurrence, with attendee management across a care team that changes over time.',
      'New users arrive mid-crisis, so onboarding had to reach a working CareSpace in a handful of guided steps.',
    ],
    solution: [
      {
        heading: 'Front End — React + Redux + Tailwind',
        body:
          'Figma designs translated into a responsive React application with Redux managing cross-module state — the care recipient context, team membership, and permissions that every screen depends on. Tailwind CSS kept the design system consistent across the marketing site and the dashboards.',
      },
      {
        heading: 'Care Modules',
        body:
          'Seven modules on a shared shell: a Bulletin Board activity feed with attachments and reactions, a Tasks Board with ownership and priority states, a calendar with recurrence and attendee management, encrypted Document Storage, a Health Zone, MyChart integration for clinical records, and Team Management.',
      },
      {
        heading: 'Back End — Node.js + Express + MongoDB',
        body:
          'REST APIs in Node.js and Express with MongoDB behind them, modelling CareSpaces, care recipients, team membership, and the permission graph connecting them. Document metadata stays separate from document contents.',
      },
      {
        heading: 'Security — JWT + Role-Based Access',
        body:
          'JWT authentication with role-based access control distinguishing care recipients from team members and administrators. Documents are held under AES-256 encryption with per-folder permissions, so financial and legal records stay restricted even inside a trusted care team.',
      },
      {
        heading: 'Onboarding & Delivery',
        body:
          'A progressive onboarding checklist walks a new user from account creation to a populated CareSpace with invited caregivers. Deployed on AWS, with work across performance, security, and accessibility.',
      },
    ],
    results: [
      'Full platform delivered end to end — marketing site, care dashboards, and the API layer serving them.',
      'Seven coordination modules unified in one CareSpace, replacing scattered chats, drives, and paper folders.',
      'Sensitive records protected by AES-256 encryption with per-folder permissions inside shared care teams.',
      'Clinical records surfaced alongside family coordination through MyChart integration.',
    ],
    techStack: [
      'React',
      'Redux',
      'Tailwind CSS',
      'Node.js',
      'Express',
      'MongoDB',
      'JWT',
      'AWS',
    ],
  },
]

export const getCaseStudyBySlug = (slug) =>
  caseStudies.find((cs) => cs.slug === slug)
