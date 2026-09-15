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
/* Legal shells                                                         */
/* ------------------------------------------------------------------ */

export const legalPages = {
  privacy: {
    title: 'Privacy',
    updated: '15 September 2026',
    sections: [
      {
        heading: 'What we collect',
        body: 'We collect information you send directly, such as your name, email, and form or email content. We use PostHog to measure site visits, funnel actions, and session interactions, and use the Meta Pixel and server-side conversion measurement for advertising performance. Meta may provide or read the _fbp and _fbc identifiers used to connect those actions to an ad visit.',
      },
      {
        heading: 'Client code and data',
        body: 'Code shared with us for a scan or an audit is read-only, stored encrypted, deleted on the schedule stated on the relevant page, and never used to train anything. It is never shared or quoted without written permission.',
      },
      {
        heading: 'What we do not do',
        body: 'We do not sell data or enrich your email against third-party databases. PostHog funnel events do not include names, emails, app details, inquiry text, attribution tokens, or Meta event identifiers. Meta conversion events do not include scanned app URLs, inquiry details, findings, source code, builder answers, shipping context, UTM values, or report contents. For a saved request, we may send Meta a normalized SHA-256 hash of the submitted email plus available browser, click, IP, and user-agent signals for measurement and attribution.',
      },
      {
        heading: 'Advertising measurement choices',
        body: 'The initial advertising program is limited to the United States. We respect Global Privacy Control and an Engisols tracking preference when present; a denied decision prevents both browser Pixel events and server-side Meta conversion events. Browser privacy tools may also block Meta requests. Meta processes measurement data under its own terms and privacy policy.',
      },
      {
        heading: 'Your rights',
        body: 'Ask us what we hold and we will tell you. Ask us to delete it and we will, within thirty days, unless a contract requires otherwise.',
      },
    ],
    blocker: '{{TODO: LEGAL}} — this is a plain-language draft, not reviewed by a lawyer. It must be before launch.',
  },
  terms: {
    title: 'Terms',
    updated: '1 September 2026',
    sections: [
      {
        heading: 'What this covers',
        body: 'Use of this website. Client engagements are governed by the signed contract for that engagement, which takes precedence over anything here.',
      },
      {
        heading: 'Ownership of work',
        body: 'For client engagements, IP assignment is signed before work begins and everything produced is the client’s outright, with no licence-back.',
      },
      {
        heading: 'Content on this site',
        body: 'Case studies are published with client permission. Metrics are stated as measured, with attribution where a figure belongs to a client platform rather than to our work.',
      },
      {
        heading: 'Liability',
        body: 'This site is provided as is. Engagement liability is defined in the engagement contract, not here.',
      },
    ],
    blocker: '{{TODO: LEGAL}} — this is a plain-language draft, not reviewed by a lawyer. It must be before launch.',
  },
}
