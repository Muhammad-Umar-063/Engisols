import type { FAQ } from '@/components/sections/shared'

/** Public page copy. Project evidence is attributed in the case studies. */

/* ------------------------------------------------------------------ */
/* Pricing (/pricing)                                                   */
/* ------------------------------------------------------------------ */

export const pricingPage = {
  hero: { title: 'A quote based on the work your product needs.', lead: 'Choose an engineering review, a defined build, or ongoing support. We discuss the scope before quoting a fee or delivery schedule.' },
  whenWereWrong: {
    title: 'Choose the right kind of help',
    lead: 'The shape of the problem matters as much as the technology.',
    items: ['A permanent role may suit work that needs continuing ownership inside your company.', 'A small, well-defined task may be a good fit for an individual specialist.', 'An unclear codebase benefits from a review before a large build commitment.', 'A new product needs a clear user problem and priorities before a delivery estimate can be useful.'],
  },
  billing: { title: 'What your proposal should settle', rows: [['Scope', 'Deliverables, exclusions, and assumptions'], ['Price', 'The fee and currency for the agreed work'], ['Schedule', 'Milestones, dependencies, and availability'], ['Billing', 'Payment stages and any agreed expenses'], ['Changes', 'How changes to scope, fees, or timing are agreed'], ['Handover', 'Access, documentation, and support requirements']] as [string, string][] },
  guarantee: { title: 'Decide with the scope in front of you', body: ['A website cannot price an unfamiliar codebase accurately. Share the product, the blocked work, and your constraints so we can determine what needs reviewing.', 'Any payment, cancellation, support, or ownership terms belong in the written proposal and engagement agreement. Review those terms before proceeding.'] },
  faqs: [
    { q: 'Can you quote before seeing the code?', a: 'An initial conversation can establish fit. A reliable estimate for existing software may also require an agreed review of its architecture, dependencies, and current behavior.' },
    { q: 'Is the initial inquiry a paid commitment?', a: 'No. Sending an inquiry asks us to discuss your project. It does not purchase an audit or start an engagement.' },
    { q: 'How are changes handled?', a: 'The proposal should identify how new requirements affect the scope, cost, and schedule. Ask for any change to be recorded before it is implemented.' },
    { q: 'What determines the cost?', a: 'The current codebase, required behavior, integrations, data migration, testing, and handover needs all affect the work. Include any fixed budget or deadline in your inquiry.' },
  ] as FAQ[],
  cta: 'Tell us what you need to ship and what is blocking it.',
}

/* ------------------------------------------------------------------ */
/* Build Audit (/pricing/build-audit) — the conversion target           */
/* ------------------------------------------------------------------ */

export const buildAudit = {
  hero: { title: 'Understand the build before you commit to the next step.', lead: 'A scoped engineering review can help you decide what to repair, what to replace, and what to do first. Start by describing the product and the problem.', facts: [['Price', 'Quoted after review scope is agreed'], ['Schedule', 'Confirmed with the proposal'], ['Possible deliverables', 'Findings, priorities, and next-step recommendations'], ['First step', 'Send a project inquiry']] as [string, string][] },
  whoFor: {
    left: { title: 'Useful when', items: ['You inherited a codebase without a clear technical owner.', 'An AI feature behaves differently with real data.', 'A build is stalled and the remaining work is unclear.', 'You need to compare repair and rebuild options.'] },
    right: { title: 'A different starting point may help when', items: ['There is no code or system to review yet.', 'You need visual design or product research first.', 'The task is already narrow enough to implement directly.'] },
  },
  deliverable: { title: 'Agree what the review needs to answer', lead: 'The proposal defines the deliverables for your system. A review can include:', items: ['Prioritised engineering findings', 'Architecture and dependency observations', 'Repair and rebuild options', 'Recommended next steps with assumptions'] },
  howItWorks: [
    { meta: 'Scope', title: 'Describe the blocked work', body: 'Share the product context, known failures, and the decision you need to make.' },
    { meta: 'Access', title: 'Agree the review boundaries', body: 'Confirm the required access, confidentiality terms, deliverables, fee, and schedule before a review begins.' },
    { meta: 'Review', title: 'Inspect and reproduce', body: 'Examine the agreed areas of the system and investigate the behavior behind the reported problems.' },
    { meta: 'Findings', title: 'Choose the next step', body: 'Discuss the findings, remaining uncertainty, and the options for moving forward.' },
  ],
  whyPaid: { title: 'Separate diagnosis from the build decision', body: ['A focused review is engineering work with its own scope. It can answer a technical question before a larger implementation is commissioned.', 'Discuss the proposed outputs and fee first. Sending an inquiry does not commit you to an audit or a subsequent build.'] },
  faqs: [
    { q: 'Should I send repository access in the inquiry?', a: 'Start with a description and an optional public product URL. Access and confidentiality requirements can be agreed separately. Do not send credentials through the form.' },
    { q: 'How long does a review take?', a: 'The codebase, review questions, and access requirements determine the schedule. Timing is confirmed in the proposal.' },
    { q: 'Will a review prove the whole system is production-ready?', a: 'No review can establish that from a limited scope. The findings should state what was inspected, what was not, and which questions remain.' },
    { q: 'Does an inquiry commit me to a build?', a: 'No. Review and implementation are separate decisions. You can discuss the findings before deciding what happens next.' },
  ] as FAQ[],
}

/* ------------------------------------------------------------------ */
/* Process (/process)                                                   */
/* ------------------------------------------------------------------ */

export const processPage = {
  hero: { title: 'Make the work, decisions, and next steps clear.', lead: 'Start with the problem, agree the scope, and inspect progress together. The details depend on the product and the people who will operate it.' },
  phases: [
    { meta: 'Understand', title: 'Review the starting point', body: 'Clarify the product, users, current system, and the reason the work matters.' },
    { meta: 'Plan', title: 'Agree a workable scope', body: 'Set out deliverables, dependencies, assumptions, and how progress will be reviewed.' },
    { meta: 'Build', title: 'Implement and validate', body: 'Work through the agreed priorities, test the important behavior, and surface decisions as they arise.' },
    { meta: 'Handover', title: 'Prepare the next owner', body: 'Include deployment, operating notes, documentation, and support expectations in the scope.' },
  ],
  communication: { title: 'Agree communication before starting', rows: [['Project contact', 'Who can answer product and technical questions'], ['Working overlap', 'Hours that fit the people on the project'], ['Progress reviews', 'A cadence suited to the scope'], ['Decisions', 'Where changes and approvals are recorded'], ['Tools', 'Repository, issue tracker, and communication channels']] as [string, string][] },
  legal: { title: 'Settle access and ownership in writing', items: ['Confirm who owns the repository and infrastructure.', 'Agree any confidentiality and data-handling requirements before access.', 'Record the deliverables, payment terms, and change process.', 'Define handover requirements and any support after delivery.'] },
  fromYou: { title: 'Useful context for the first conversation', lead: 'A short description is enough to begin.', items: ['What the product does and who uses it.', 'What is blocked or needs to change.', 'Existing technical documentation, if available.', 'Budget, deadlines, and dependencies we should understand.'] },
  cta: 'Start with the part of the product that needs attention.',
}

/* ------------------------------------------------------------------ */
/* About (/about)                                                       */
/* ------------------------------------------------------------------ */

export const aboutPage = {
  hero: { title: 'Engineering for products with work still to do.', lead: 'Engisols works on AI systems, web applications, integrations, and the infrastructure behind them. The project stories show the work in detail.' },
  why: { title: 'Start with the behavior that matters', paragraphs: ['A useful engineering decision connects the code to a real user need. For a stalled build, that starts with understanding what is working, what is blocked, and which assumptions need testing.', 'We focus on inspectable systems: clear data flow, explicit failure handling, and documentation that helps the next person understand the decisions.'] },
  history: { title: 'Work you can inspect', paragraphs: ['Published projects include SoloSuit, PastPresent, ProLyrics.ai, Quick Sync, and Alula. They cover legal workflows, agentic AI, automation, Web3, and SaaS applications.', 'Each case study describes the product, the engineering work, and the available results. Platform metrics remain attributed to the platform they describe.'] },
  wont: { title: 'Define the fit before the engagement', items: ['Start with a problem and the decision or result you need.', 'Treat timing and cost as scope questions.', 'Agree access and confidentiality requirements before sharing private systems.', 'Use the published project work to assess relevant experience.'] },
  cta: 'Tell us about your product and the work ahead.',
}

/* ------------------------------------------------------------------ */
/* Contact (/contact)                                                   */
/* ------------------------------------------------------------------ */

export const contactPage = {
  hero: { title: 'Tell us what you are building.', lead: 'Tell us about your product, the work you need, and what you want to achieve.' },
  next: { title: 'What happens after your inquiry', steps: [
    { meta: 'Context', title: 'We read your project details', body: 'Your description helps establish the technical problem and whether the work fits.' },
    { meta: 'Discussion', title: 'Clarify the next step', body: 'We may ask for more context or arrange a conversation before proposing a scope.' },
    { meta: 'Scope', title: 'Review a proposal', body: 'Any proposed engagement sets out the work, timing, and commercial terms before you decide to proceed.' },
  ] },
  alternatives: { title: 'Contact details', rows: [['Email', 'growth@engisols.com']] as [string, string][] },
}

/* ------------------------------------------------------------------ */
/* Scan funnel (/scan)                                                  */
/* ------------------------------------------------------------------ */

export const scanPage = {
  hero: {
    title: 'A first look at your public app.',
    lead: 'Production Check inspects a public app URL and its browser assets for observable risk signals. The report separates findings from expected public configuration and states what could not be checked.',
    facts: [['Price', 'Free'], ['Input', 'A public app URL'], ['You get', 'Findings, evidence labels, and coverage'], ['Access', 'No repository credentials required']] as [string, string][],
  },
  checks: [
    { title: 'Public credential signals', body: 'Known server-secret and private-key patterns in public assets. Detected values are not tested against provider APIs.' },
    { title: 'Expected public keys', body: 'Client-side configuration such as publishable keys, distinguished from server credentials.' },
    { title: 'Public integration references', body: 'Observable references to providers, tables, and endpoints that may need engineering review.' },
    { title: 'Browser asset coverage', body: 'The public pages and assets the scanner could inspect, with limits stated beside the findings.' },
    { title: 'Review priorities', body: 'Findings grouped as FIX NOW, REVIEW, or EXPECTED, with context for deciding the next step.' },
  ],
  whoFor: ['You have a publicly accessible app and want to inspect what its browser assets expose.', 'You are preparing to launch and want a starting point for an engineering review.', 'You need to distinguish expected client configuration from potential server-secret exposure.', 'You want an initial report before deciding whether to commission a deeper review.'],
  privacy: {
    title: 'What the check accesses',
    rows: [['Access', 'Public pages and browser assets'], ['Credentials', 'No login or repository credentials required'], ['Stored report', 'Sanitized findings and coverage information'], ['Report links', 'Anyone with a shared report link may be able to view it'], ['Limits', 'Private code, authenticated behavior, and database policies are not verified']] as [string, string][],
  },
  faqs: [
    { q: 'Does this inspect my private repository?', a: 'No. Production Check inspects a public URL and public browser assets. A private code review requires a separately agreed scope and access.' },
    { q: 'Does a clear report prove the app is secure?', a: 'No. A public scan has limited coverage. Authentication, database permissions, payments, and server behavior can require deeper inspection.' },
    { q: 'Are detected keys tested?', a: 'No. The scanner identifies observable patterns without using them to call provider APIs.' },
    { q: 'What happens after the report?', a: 'Review the findings and coverage. You can request an Engineer Scope Review if you want help deciding what to inspect next.' },
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
  },
}
