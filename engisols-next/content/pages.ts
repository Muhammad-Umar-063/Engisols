import type { FAQ } from '@/components/sections/shared'

/**
 * ⚠️  DEMO CONTENT — drafted, not signed off. See content/services.ts header.
 *
 * The standalone pages: pricing, the Build Audit landing page, process, about,
 * contact, the scan funnel and the legal shells.
 *
 * Every figure in `pricingFaqs`, `buildAudit` and `pricingLadder` is INVENTED.
 * Publishing a wrong price is a commercial problem rather than a copy problem,
 * so all of it is gated behind {{TODO: PRICING}}.
 */

/* ------------------------------------------------------------------ */
/* Pricing (/pricing)                                                   */
/* ------------------------------------------------------------------ */

export const pricingPage = {
  hero: {
    title: 'We publish our prices. Most agencies in this market do not.',
    lead: 'Three ways in, with real numbers and a plain line on who each one is for. If you can rule us out from this page without a call, the page has done its job.',
  },
  whenWereWrong: {
    title: 'When you should not hire us',
    lead: 'This section costs us nothing and it is the fastest way to tell whether we are worth a conversation.',
    items: [
      'You need this capability continuously for more than about twelve months. Hire someone. It is cheaper and better, and we will say so on the call.',
      'You have a small, well-specified task with a clear finish line. A marketplace freelancer will do it faster and for less.',
      'You need design from scratch — brand, identity, a visual language. We build against a design, we do not originate one.',
      'You want staff augmentation: bodies under your direction, billed hourly. We take ownership of outcomes or we do not take the work.',
      'You have no code and no clear problem yet. Spend two weeks with an AI coding tool first. Genuinely.',
    ],
  },
  billing: {
    title: 'How billing works',
    rows: [
      ['Currency', 'USD. GBP and EUR by arrangement.'],
      ['Audit', '100% up front. Fixed fee, ten working days.'],
      ['Build', '40% to start, 40% at the agreed midpoint, 20% on handover.'],
      ['Retainer', 'Monthly in advance, thirty days notice either way.'],
      ['Change orders', 'Written, priced, and signed before the work starts.'],
      ['Late payment', 'Work pauses at 14 days overdue. Nothing is deleted or withheld.'],
      ['Expenses', 'Only what is agreed in writing. No markup.'],
    ] as [string, string][],
  },
  guarantee: {
    title: 'The guarantee on the Build Audit',
    body: [
      'If the audit does not tell you something you did not already know, we refund it in full. Not a credit, not a discount on future work — the fee back.',
      'You decide, not us. There is no adjudication process and no requirement to explain yourself. Send one line saying it was not useful and the refund is processed that week.',
      'If you proceed to a build with us within ninety days, the full audit fee credits against it. So the audit is either useful, free, or deducted.',
    ],
  },
  faqs: [
    {
      q: 'Why is the range on a build so wide?',
      a: 'Because a focused internal tool and a customer-facing product with payments, roles and an integration surface are genuinely different jobs. The audit exists to turn the range into a number before you commit to anything.',
    },
    {
      q: 'What happens if the project overruns?',
      a: 'On fixed-scope work, an overrun caused by our estimating error is ours to absorb. An overrun caused by added scope is a change order, priced and agreed before the work happens. The distinction is written down before we start, which is the only time it can be discussed calmly.',
    },
    {
      q: 'What if we want to stop halfway?',
      a: 'You can, at any milestone. You pay for work completed to that point, you keep everything — the repo is yours from the first commit — and we write a handover note so the next team is not starting cold.',
    },
    {
      q: 'What if we disagree about whether something was in scope?',
      a: 'The written scope from week zero is the reference, which is exactly why we will not start without one. In practice the argument is usually about a genuine ambiguity, and our default is to absorb small ones and quote honestly for large ones.',
    },
    {
      q: 'What happens if you disappear?',
      a: 'Everything is already in your GitHub organisation and your cloud account, with documentation written as we go rather than at the end. Losing us costs you continuity and time, not access or ownership. That is deliberate.',
    },
    {
      q: 'Do you take equity instead of fees?',
      a: 'No. It complicates the relationship, misaligns the incentives on scope, and we are not investors. Cash for work, priced up front.',
    },
  ] as FAQ[],
  cta: 'Still not sure which tier you are? That is what the audit is for.',
}

/* ------------------------------------------------------------------ */
/* Build Audit (/pricing/build-audit) — the conversion target           */
/* ------------------------------------------------------------------ */

export const buildAudit = {
  hero: {
    title: 'Ten working days. A written verdict on your build. Refunded if it is not useful.',
    lead: 'The paid front door. We read the code, reproduce the failures, and tell you plainly what is wrong, what it costs to fix, and whether it is worth fixing at all.',
    facts: [
      ['Price', '$2,400 fixed'],
      ['Duration', '10 working days'],
      ['You get', 'Written report, roadmap, risk register, walkthrough call'],
      ['Guarantee', 'Full refund if it tells you nothing new'],
    ] as [string, string][],
  },
  whoFor: {
    left: {
      title: 'For you if',
      items: [
        'You inherited a codebase and nobody remaining understands it.',
        'The MVP got to roughly 70% and has stayed there for months.',
        'An AI feature works in the demo and fails on real data.',
        'The developer who built it has left.',
        'Every estimate to finish comes back longer than the last one.',
        'You are raising, and someone is about to read this codebase.',
      ],
    },
    right: {
      title: 'Not for you if',
      items: [
        'You need a design from scratch. That is not what we do.',
        'You want staff augmentation billed by the hour.',
        'You have no code yet — there is nothing to audit.',
        'You want a second opinion to win an argument with your current team.',
        'You need it in three days. Ten working days is the honest minimum.',
      ],
    },
  },
  deliverable: {
    title: 'What you physically get',
    lead: 'Four artifacts. All written, all yours, all useful to whoever does the work next — including if that is not us.',
    items: [
      'A written findings report, prioritised by what stops you shipping',
      'A remediation roadmap with effort estimates against each item',
      'A risk register: what breaks first and what it takes down with it',
      'A recorded ninety-minute walkthrough call where you argue with all of it',
      'The rebuild-or-repair recommendation, with the reasoning shown',
      'Your repo untouched — we read, we do not commit',
    ],
  },
  howItWorks: [
    {
      meta: 'Day 1',
      title: 'NDA, repo access, environment',
      body: 'Signed before access. We get it running locally on day one, and how long that takes is itself the first finding.',
    },
    {
      meta: 'Days 2–4',
      title: 'Read everything, change nothing',
      body: 'Architecture, data model, dependencies, deploy path, test coverage, permissions. Building an accurate picture before having opinions about it.',
    },
    {
      meta: 'Days 5–8',
      title: 'Reproduce the failures',
      body: 'The bugs you can describe, and the ones you have stopped mentioning because they seem permanent. Both matter, and the second set is usually more diagnostic.',
    },
    {
      meta: 'Day 9',
      title: 'Write it up',
      body: 'Prioritised findings, effort estimates, the risk register, and a number against each path forward.',
    },
    {
      meta: 'Day 10',
      title: 'Walkthrough call',
      body: 'Ninety minutes, recorded. You push back, we defend or concede, and you leave with a decision rather than a document.',
    },
  ],
  whyPaid: {
    title: 'Why it is paid',
    body: [
      'A free audit is a sales call with a document attached. The incentive is to find enough wrong to justify a proposal, and everyone in the room knows it.',
      'A paid audit is work. We are being paid to be right, not to be hired, which is why the deliverable is useful whether or not you ever speak to us again.',
      'The fee credits in full against a build within ninety days, so if you do hire us, the audit cost you nothing. And if the report is not useful, it is refunded. The only outcome where you are out of pocket is the one where we were genuinely wrong.',
    ],
  },
  faqs: [
    {
      q: 'Will you sign an NDA?',
      a: 'Yes, before repo access, every time. It is step one on day one and we have a standard mutual NDA ready if you do not have your own.',
    },
    {
      q: 'What happens to our code?',
      a: 'Read-only access, cloned to an encrypted machine, deleted within thirty days of delivery. Nothing is retained, nothing is reused, and nothing goes near a training pipeline.',
    },
    {
      q: 'What if you find nothing?',
      a: 'Then the report says so and you have the confidence you paid for — which for a team about to raise or about to commit a quarter to a rebuild is worth the fee on its own. If you disagree, it is refunded.',
    },
    {
      q: 'What if you find too much?',
      a: 'The report is prioritised precisely for that case: what must be fixed to ship, what can wait, what you can live with permanently. A hundred findings with no order is a document nobody acts on.',
    },
    {
      q: 'Does the fee credit against a build?',
      a: 'In full, against any build starting within ninety days of delivery.',
    },
    {
      q: 'Can we use the report to brief a different team?',
      a: 'Yes. It is written to be useful to whoever does the work, not as a sales document for us. Several clients have done exactly that, and one of them came back eighteen months later.',
    },
  ] as FAQ[],
}

/* ------------------------------------------------------------------ */
/* Process (/process)                                                   */
/* ------------------------------------------------------------------ */

export const processPage = {
  hero: {
    title: 'Working with three engineers on the other side of the world.',
    lead: 'The offshore objection is legitimate. This page answers it in specifics — overlap hours, who you talk to, who owns the code, and what happens if we go quiet.',
  },
  phases: [
    {
      meta: '1–2 weeks',
      title: 'Discovery',
      body: 'Scope, constraints, and the written definition of done. Ends with a fixed price and a date, or an honest statement that we are the wrong fit.',
    },
    {
      meta: '4–12 weeks',
      title: 'Build',
      body: 'Weekly shipped increments on a real URL. Your repo, your cloud, from the first commit. Written updates you read rather than meetings you attend.',
    },
    {
      meta: '1 week',
      title: 'Handover',
      body: 'Documentation, architecture notes, a recorded walkthrough, and access confirmed. Written for the engineer who joins after us.',
    },
    {
      meta: '30–90 days',
      title: 'Support window',
      body: 'Defined response times in writing. After that, either your team owns it or we move to a retainer — both are normal.',
    },
  ],
  communication: {
    title: 'Communication',
    rows: [
      ['Overlap, US Eastern', '9am – 1pm ET, every working day'],
      ['Overlap, UK and EU', '2pm – 6pm GMT, every working day'],
      ['Who you talk to', 'The engineer writing the code, by name'],
      ['Written update', 'Every Friday, whether or not anything went wrong'],
      ['Response time, working hours', 'Within 2 hours'],
      ['Response time, outside', 'Next working morning'],
      ['Escalation', 'Direct phone number for all three of us'],
      ['Tools', 'Your Slack or ours, your tracker, your repo'],
    ] as [string, string][],
  },
  legal: {
    title: 'Legal and ownership',
    items: [
      'IP assignment signed before any code is written. Everything produced is yours outright.',
      'Mutual NDA as standard, or yours if you prefer it.',
      'Code lands in your GitHub organisation from the first commit. Never ours, never mirrored.',
      'Infrastructure runs in your cloud account, under your billing.',
      'No licence-back clauses, no shared ownership, no portfolio rights without written permission.',
      'If the engagement ends early, for any reason, you keep everything and we write the handover note anyway.',
    ],
  },
  fromYou: {
    title: 'What we need from you',
    lead: 'Expectations in both directions. Most delays on projects this size are not engineering delays.',
    items: [
      'One decision maker who can say yes without a committee.',
      'Access on day one: repo, cloud, the third-party accounts we will need.',
      'Review turnaround within two working days on anything blocking.',
      'Somebody who knows the domain available for questions during overlap hours.',
      'Honesty about deadlines that are real versus deadlines that are aspirational.',
    ],
  },
  cta: 'Every one of those commitments is in the contract, not just on this page.',
}

/* ------------------------------------------------------------------ */
/* About (/about)                                                       */
/* ------------------------------------------------------------------ */

export const aboutPage = {
  hero: {
    title: 'Three senior engineers who decided not to become fifteen.',
    lead: 'Scaling an agency means hiring people cheaper than yourself and selling their time at your rate. That is a business model, and it is the one that produces the codebases we get hired to rescue.',
  },
  why: {
    title: 'Why we work this way',
    paragraphs: [
      'The economics of a growing agency push in one direction: hire juniors, bill them at senior-adjacent rates, and add a project manager to keep the client away from the seams. It works commercially, which is why it is so common.',
      'It also produces the specific failure we spend most of our time repairing — a system with no single owner, where every individual decision was defensible and the whole is incoherent. We would rather not manufacture our own pipeline.',
      'The honest cost of that choice is capacity. Three people can run a small number of builds at once, which is why the availability line on the homepage is real and why we sometimes say no. We would rather turn work away than staff it with someone we would not want on our own project.',
    ],
  },
  history: {
    title: 'How we got here',
    paragraphs: [
      'We met working on the same platform from three different contracts, which is a slow way to learn that you agree about how software should be built.',
      'Engisols started in 2023 taking overflow work from teams who had run out of senior capacity. The rescue work arrived on its own — by 2025 it was most of what came in, largely because AI coding tools had put a great many products at 70% and left them there.',
      'Since then: shipped products across legal tech, AI SaaS, care coordination and Web3, for clients in the US, UK, EU, Australia, New Zealand and Saudi Arabia.',
    ],
  },
  wont: {
    title: 'What we do not do',
    items: [
      'Design from scratch. No brand work, no identity, no visual language origination.',
      'Staff augmentation. We take ownership of outcomes, not tickets.',
      'Anything we cannot staff with a senior. If it needs a fourth person, it is not our project.',
      'Fixed-price work with no written scope. That is not a price, it is an argument scheduled for later.',
      'Native mobile. We will build the API and be honest about who should build the app.',
    ],
  },
  cta: 'If a small senior team is the shape you want, we should talk.',
}

/* ------------------------------------------------------------------ */
/* Contact (/contact)                                                   */
/* ------------------------------------------------------------------ */

export const contactPage = {
  hero: {
    title: 'Talk to the person who would do the work.',
    lead: 'Not a sales team, not a form that routes to a queue. One of the three of us answers, usually the one whose area it is.',
  },
  next: {
    title: 'What happens after you book',
    steps: [
      {
        meta: 'Immediately',
        title: 'Confirmation with the call link',
        body: 'Plus a short note asking for anything useful in advance — a repo, a doc, a screenshot of the thing that is broken. Optional, and it makes the call better.',
      },
      {
        meta: 'On the call, 30 minutes',
        title: 'We work out whether this is real',
        body: 'What is broken, what you have tried, what the deadline actually is. If we are the wrong answer we will say so and point you at the right one.',
      },
      {
        meta: 'Within two working days',
        title: 'A written follow-up',
        body: 'What we heard, what we would do, what it would cost and how long. In writing, so you can forward it to whoever else has to agree.',
      },
    ],
  },
  alternatives: {
    title: 'Or skip the calendar',
    rows: [
      ['Email', 'growth@engisols.com'],
      ['Response time', 'Within one working day'],
      ['Overlap, US Eastern', '9am – 1pm ET'],
      ['Overlap, UK and EU', '2pm – 6pm GMT'],
      ['Markets', 'US, UK, EU, Australia, New Zealand, Saudi Arabia'],
    ] as [string, string][],
  },
}

/* ------------------------------------------------------------------ */
/* Scan funnel (/scan)                                                  */
/* ------------------------------------------------------------------ */

export const scanPage = {
  hero: {
    title: 'Free repo and app health scan.',
    lead: 'Point us at the repository. We run the same first-pass checks the paid audit starts with and send you the findings. No call, no invoice, no obligation.',
    facts: [
      ['Price', 'Free'],
      ['Turnaround', '2 working days'],
      ['You get', 'A written findings summary by severity'],
      ['Your code', 'Deleted within 7 days'],
    ] as [string, string][],
  },
  checks: [
    {
      title: 'Security',
      body: 'Exposed secrets, dependency vulnerabilities with a known exploit path, authentication and permission gaps, and anything writing sensitive data somewhere it should not.',
    },
    {
      title: 'Dependency risk',
      body: 'Unmaintained packages, versions pinned so far back that upgrading is now a project, and licences that will fail an enterprise procurement review.',
    },
    {
      title: 'Architecture',
      body: 'Coupling, the shape of the data model, and whether the seams between subsystems are consistent — the specific place AI-generated code tends to come apart.',
    },
    {
      title: 'Scalability',
      body: 'Queries that will not survive a hundred times the rows, missing indexes, N+1 patterns, and work being done in a request that should be in a queue.',
    },
    {
      title: 'Running cost',
      body: 'Where the money goes at your current volume and what happens to that number at ten times the traffic. Usually one endpoint or one query.',
    },
  ],
  whoFor: [
    'You built on Lovable, v0, Bolt, Base44, Cursor or Claude and are now stuck.',
    'You inherited a codebase and want a second opinion before committing to it.',
    'You are about to raise and would rather find the problems before diligence does.',
    'You are scaling and something is getting slower in a way nobody has diagnosed.',
  ],
  privacy: {
    title: 'What happens to your code',
    rows: [
      ['Access', 'Read-only. We never commit, never open a pull request.'],
      ['Storage', 'Cloned to an encrypted machine, never a shared drive.'],
      ['Retention', 'Deleted within 7 days of the report being sent.'],
      ['Training', 'Never used to train anything, by us or anyone else.'],
      ['Sharing', 'Never shared, quoted or used as an example without written permission.'],
      ['NDA', 'Available before you send anything. Ask and we sign it same day.'],
    ] as [string, string][],
  },
  faqs: [
    {
      q: 'Why is it free? What is the catch?',
      a: 'It is the top of our funnel and we are not pretending otherwise. Some people who get a scan book the paid audit. Most do not, and that is fine — the scan is cheap for us to run because it is largely automated.',
    },
    {
      q: 'Is this just a tool running lint?',
      a: 'The first pass is automated. A person reads the output before it is sent, which is why it takes two days rather than two minutes, and why the summary says what the findings mean rather than listing rule violations.',
    },
    {
      q: 'What if the repo is private?',
      a: 'Most are. Add us as a read-only collaborator, or send an archive. We will sign an NDA first if you want one.',
    },
    {
      q: 'How is this different from the paid audit?',
      a: 'The scan is automated checks plus a human summary, across two days. The audit is ten days of a senior engineer reading the code, reproducing your specific failures, and producing a prioritised roadmap with effort estimates. The scan tells you whether something is wrong; the audit tells you what to do about it.',
    },
  ] as FAQ[],
}

export const scanNextPage = {
  hero: {
    title: 'You have the scan. Here is what to do with it.',
    lead: 'A findings list is not a plan. This is the honest account of what the scan can and cannot tell you, and when it is worth paying for the deeper read.',
  },
  case: {
    title: 'When the audit is worth it',
    items: [
      'The scan found things you did not know about, and you cannot tell which matter.',
      'You are choosing between repairing and rebuilding, and the answer changes your quarter.',
      'You are about to commit real budget and want the estimate to survive contact.',
      'Somebody needs a document to take to a board, an investor or a co-founder.',
    ],
  },
}

/* ------------------------------------------------------------------ */
/* Legal pages                                                          */
/* ------------------------------------------------------------------ */

export const legalPages = {
  privacy: {
    title: 'Privacy policy',
    updated: '15 September 2026',
    intro:
      'This policy explains what Engisols collects through this website, the AI App Audit inquiry, Production Check, Engineer Scope Review, and scoped offers, and how that information is handled.',
    sections: [
      {
        heading: 'Information you provide',
        paragraphs: [
          'We collect information you choose to send to us. Depending on the form or conversation, that can include your name, work email, optional company details, an app URL or product name, what you want reviewed, timelines, and other context you enter.',
          'Please do not put passwords, private keys, API tokens, production credentials, health information, or other unnecessary sensitive data into a general website form. Forms used for audit and review inquiries reject common credential-like patterns, but that check is not a substitute for your own care.',
        ],
      },
      {
        heading: 'Production Check data',
        paragraphs: [
          'When you start a Production Check, we store the submitted URL, builder and launch-stage answers you choose, campaign attribution associated with the visit, scan progress, and a sanitized result. The result can include public-risk scores, finding counts and classifications, detected technologies, coverage information, evidence labels, and a public report-share identifier.',
          'The scanner makes bounded requests to public pages and public browser assets. Its persistence layer is designed not to retain fetched raw HTML or JavaScript bundles, discovered raw credentials, query strings, URL fragments, or unnecessary page content. Credential-like values cause a report to be rejected instead of stored. A report may still identify the scanned public origin and describe the kind of public evidence observed.',
          'Production Check reports use hard-to-guess links, but anyone with a report link may be able to view it until it expires. Share the link only with people you trust.',
        ],
      },
      {
        heading: 'Engineer Scope Review and offers',
        paragraphs: [
          'If you request an Engineer Scope Review, we store your contact details, sanitized app URL and scan summary, builder and launch answers, the type and timing of help requested, optional shipping context, your main concern, your willingness to provide limited evidence or access later, and the review status.',
          'If Engisols prepares a scoped offer, we also store its recommendation, inclusions, exclusions, price, billing basis, delivery window, status, and any approval or decline. Approval records your decision about the proposed scope; it does not record a payment. Payment and onboarding are handled separately.',
          'An AI App Audit inquiry stores the name, work email, app or product, review concern, and attribution you submit. Any repository access or client code later shared for a paid engagement is governed by the relevant NDA or signed engagement terms, not by the public Production Check retention schedule.',
        ],
      },
      {
        heading: 'Analytics, session replay, and advertising measurement',
        paragraphs: [
          'We use PostHog for product analytics, error capture, and session replay. Depending on your use of the site, it may record pages visited, navigation, clicks, scrolls, browser and device information, performance information, and other page interactions. Input values are masked in session replay, while sensitive rendered evidence is blocked. Replay and PostHog events are disabled on internal Production Check operator pages, and automatic capture is disabled on capability-bearing offer pages.',
          'We use the Meta Pixel and Meta Conversions API to understand advertising and conversions. Meta may receive page-view or conversion events, Meta cookie identifiers such as _fbp and _fbc, a hashed version of a submitted email for saved lead events, IP address, browser user agent, event time, and the page where an event happened. We do not send Meta scanned app URLs, inquiry text, findings, source code, builder answers, shipping context, UTM values, or report contents as conversion-event data.',
          'We respect Global Privacy Control and any stored Engisols Meta tracking preference. A denied decision prevents browser Pixel events and server-side Meta conversion events. Browser privacy tools may also block provider requests.',
        ],
      },
      {
        heading: 'Attribution and technical data',
        paragraphs: [
          'We may collect UTM campaign fields and a Facebook click identifier from the page address. Analytics and advertising providers may also process referrer, browser, device, operating-system, IP-address, cookie, and event information. Engisols uses those signals to understand traffic, attribute inquiries, prevent duplicate conversion events, protect the service, and diagnose failures.',
          'PostHog event properties are restricted at the application boundary for the AI App Audit and Production Check funnels. Names, emails, app details, free-text inquiry content, attribution tokens, and Meta event identifiers are not included in PostHog funnel-event properties.',
        ],
      },
      {
        heading: 'How we use information',
        items: [
          'Provide, secure, maintain, and troubleshoot the website and public tools.',
          'Run a requested scan and make its sanitized report available.',
          'Respond to inquiries and perform an Engineer Scope Review.',
          'Prepare, send, and administer a scoped offer or engagement.',
          'Measure site use, improve funnels, and understand advertising performance.',
          'Prevent abuse, enforce these terms, and meet applicable legal obligations.',
        ],
      },
      {
        heading: 'Service providers',
        paragraphs: [
          'We use Vercel for website hosting and request processing, Upstash for retained application records, Resend for transactional email delivery, PostHog for analytics, error capture, and session replay, and Meta for advertising and conversion measurement. These providers process information for the functions described above under their own service and privacy terms.',
          'We may also disclose information when required by law, to protect users or the service, or as part of a business reorganization where appropriate safeguards apply. We do not sell personal information for money. Some laws may classify advertising measurement with Meta as “sharing” or targeted advertising; the tracking choice described above controls Engisols-initiated Meta events.',
        ],
      },
      {
        heading: 'Retention',
        paragraphs: [
          'Production Check scan records, including sanitized reports, expire 90 days after creation. AI App Audit inquiries and Production Check lead records expire after 365 days. Engineer Scope Review records and scoped-offer records are also retained for up to 365 days; an offer itself is normally open for 30 days unless it says otherwise.',
          'The Engisols Meta preference cookie lasts 180 days. Browser storage may keep a conversion-event identifier to avoid sending the same event twice. PostHog and Meta apply their own retention periods under Engisols account settings and their terms; those periods are not defined in this application code.',
          'These application retention periods do not automatically delete transactional email copies held by Resend or message recipients. Provider, inbox, backup, and account-retention settings may apply separately.',
          'We may delete data sooner when it is no longer needed, and may keep limited records longer where a signed contract, dispute, security investigation, or legal obligation requires it.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'We use access controls, bounded inputs, credential-pattern checks, sanitized persistence, expiring records, and provider security features intended to reduce risk. No internet service or storage system is completely secure, so we cannot guarantee absolute security.',
          'If you believe sensitive information has been exposed through an Engisols service, contact us promptly and do not submit the information again through a general form.',
        ],
      },
      {
        heading: 'Your data rights',
        paragraphs: [
          'Depending on where you live, you may have rights to ask for access, correction, deletion, restriction, portability, or information about how personal data is used, and to object to or opt out of certain processing. You may also withdraw a consent choice for future processing.',
          'Email us using the address below. We may need to verify your identity and authority before acting. We will respond within the period required by applicable law and explain if an exception applies. You may also have the right to complain to your local data-protection authority.',
        ],
      },
      {
        heading: 'International processing',
        paragraphs: [
          'Engisols and its service providers may process information in countries other than the one where you live. Privacy protections can differ between countries. Where applicable law requires it, we use contractual or other safeguards for those transfers.',
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          'This website and its business services are not directed to children, and we do not knowingly collect personal information from children through these tools. If you believe a child has submitted information, contact us so we can review and remove it where appropriate.',
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'We may update this policy as the website, tools, or providers change. We will publish the revised version here and change the “Last updated” date. Material changes may also be highlighted in the service where practical.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'For privacy questions or requests, contact Engisols using the email link on this page. Engisols does not currently publish a separate privacy-office address or company registration identifier on this site.',
        ],
        contact: true,
      },
    ],
    related: [
      { label: 'Read the Terms', href: '/terms' },
      { label: 'Open Production Check', href: '/production-check' },
      { label: 'Learn about the AI App Audit', href: '/ai-app-audit' },
    ],
    blocker: {
      marker: '{{TODO: LEGAL}}',
      need: 'Attorney review is still required before launch. This operational draft has not been reviewed by a lawyer and is not legal advice.',
    },
  },
  terms: {
    title: 'Website terms',
    updated: '15 September 2026',
    intro:
      'These terms govern use of the Engisols website, the AI App Audit inquiry, Production Check, Engineer Scope Review, and scoped offers. A signed client agreement governs paid delivery and takes precedence if it conflicts with these website terms.',
    sections: [
      {
        heading: 'Using the Engisols website',
        paragraphs: [
          'By using this website or submitting a request, you agree to these terms. If you use the site for an organization, you confirm that you have authority to act for it. If you do not agree, do not use the tools or submit information.',
          'Website content is general information. Project advice, deliverables, fees, ownership, confidentiality, acceptance, support, and other engagement terms are set by the applicable signed agreement or expressly accepted scoped offer.',
        ],
      },
      {
        heading: 'AI App Audit',
        paragraphs: [
          'The AI App Audit is advisory and limited to the scope, access, evidence, and time agreed for that review. Findings reflect professional judgment on the material available; they are not a promise that every defect, vulnerability, cost, or operational risk will be found.',
          'Unless the signed scope expressly says otherwise, an audit is not a penetration test, legal opinion, compliance certification, financial audit, or guarantee that an application is secure, lawful, reliable, or ready to launch. You remain responsible for business, legal, security, and launch decisions.',
        ],
      },
      {
        heading: 'Production Check',
        paragraphs: [
          'Production Check is a passive, bounded review of a submitted public web surface. It may inspect publicly available response headers, HTML, browser JavaScript, linked public assets, public routes, and configuration signals. It does not request a login or repository access and is not intended to exploit, disrupt, or bypass controls.',
          'The check samples a limited surface. It cannot prove private authentication, authorization, Row Level Security, or server-side behavior, and it cannot see every route, dependency, data flow, or production condition. A missing finding is not proof of total security, compliance, production readiness, or absence of defects.',
          'Production Check is not a penetration test, certification, legal or compliance review, or substitute for source-level engineering and security review. Findings may be incomplete, time-sensitive, false positive, or safe by design and should be validated before action.',
        ],
      },
      {
        heading: 'Authorization to scan',
        paragraphs: [
          'Only submit a website or application that you own or operate, or that you are authorized to assess. Do not intentionally use Production Check to examine a third party without permission, test private systems, bypass access controls, or conduct aggressive security testing.',
          'You are responsible for the submitted target and your authorization. Engisols may refuse, limit, or stop a check where a target appears unauthorized, unsafe, unavailable, abusive, or outside the tool’s public-surface scope.',
        ],
      },
      {
        heading: 'Engineer Scope Review',
        paragraphs: [
          'Automated findings need human validation. A free Production Check or Engineer Scope Review creates no purchase obligation, and Engisols may conclude that there is no suitable paid work to recommend.',
          'To validate a private control, Engisols may ask for limited screenshots, configuration evidence, or time-bound technical access after explaining what is needed. Do not send passwords, private keys, API tokens, production credentials, or sensitive customer data in a general form. Any deeper access must be agreed separately and provided through an appropriate channel.',
        ],
      },
      {
        heading: 'Scoped offers and paid work',
        paragraphs: [
          'A scoped offer describes the work Engisols is prepared to perform. Its stated inclusions, exclusions, price, billing basis, and delivery window apply to that offer, subject to any conditions it states and any later signed agreement.',
          'Scope approval is not payment and does not by itself start work. Payment and onboarding instructions are provided separately. Work begins only after the stated commercial requirements are met. Work outside the agreed scope requires a separate written agreement or change.',
        ],
      },
      {
        heading: 'Acceptable use',
        items: [
          'Do not use the website or tools unlawfully, fraudulently, or to harm another person or system.',
          'Do not submit a target you are not authorized to assess or try to use the service for aggressive scanning, exploitation, credential testing, or access-control bypass.',
          'Do not interfere with service operation, evade rate or access limits, introduce malware, or overload the service.',
          'Do not scrape, copy, reverse engineer, or republish the tool or its content except where applicable law does not allow that restriction.',
          'Do not submit secrets, credentials, unlawful content, or personal data that is unnecessary for the request.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'Engisols and its licensors retain rights in this website, its design, copy, software, tools, methods, and branding. You may use the site and a report generated for your authorized target for your own internal evaluation, but these terms do not transfer ownership of the service or its underlying materials.',
          'You retain rights in information you submit and in the application you are authorized to assess. You give Engisols a limited permission to process submitted information only as needed to operate the requested service, protect it, and administer the relationship.',
          'Ownership of paid client deliverables is governed by the signed engagement terms. Case studies, client marks, and metrics are published only under the permissions applicable to them.',
        ],
      },
      {
        heading: 'Third-party services and links',
        paragraphs: [
          'The website relies on service providers and may link to third-party sites. Their services, content, availability, and data practices are governed by their own terms. Engisols does not control third-party services and is not responsible for changes or failures outside its reasonable control.',
        ],
      },
      {
        heading: 'Disclaimers and warranties',
        paragraphs: [
          'To the fullest extent permitted by law, the website and free tools are provided “as is” and “as available.” Engisols does not promise uninterrupted availability, error-free output, complete findings, a particular business result, or that acting on a finding will resolve every related risk.',
          'Nothing here excludes a warranty or responsibility that applicable law says cannot be excluded. Any express warranty for paid work must appear in the applicable signed agreement or offer.',
        ],
      },
      {
        heading: 'Limits on liability',
        paragraphs: [
          'To the fullest extent permitted by law, Engisols is not liable under these website terms for indirect, incidental, special, punitive, or consequential loss, or for lost profits, revenue, data, goodwill, or opportunity arising from use of a free website tool or reliance on its output.',
          'For a paid website service governed only by these terms, Engisols’ total liability is limited to the amount you paid for that specific service during the twelve months before the event giving rise to the claim. Liability for a signed client engagement is governed by that agreement. These limits do not apply where applicable law does not allow them.',
        ],
      },
      {
        heading: 'Changes to these terms',
        paragraphs: [
          'We may update these terms as the website, tools, or commercial flow changes. We will publish the revised terms here and change the “Last updated” date. Continued use after an update means the updated terms apply to later use; an existing signed engagement remains governed by its own agreement.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about these terms can be sent to Engisols using the email link on this page. Engisols does not currently publish a company registration identifier, postal address, or governing-law jurisdiction on this site.',
        ],
        contact: true,
      },
    ],
    related: [
      { label: 'Read the Privacy Policy', href: '/privacy' },
      { label: 'Open Production Check', href: '/production-check' },
      { label: 'Learn about the AI App Audit', href: '/ai-app-audit' },
    ],
    blocker: {
      marker: '{{TODO: LEGAL}}',
      need: 'Attorney review is still required before launch. This operational draft has not been reviewed by a lawyer and is not legal advice.',
    },
  },
}
