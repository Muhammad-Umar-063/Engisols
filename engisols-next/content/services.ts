import type { FAQ } from '@/components/sections/shared'

/**
 * ⚠️  DEMO CONTENT — every word below is drafted, not signed off.
 *
 * Structure follows the content spec, section 3: nine sections per service
 * page. The copy is written to be plausible and to exercise the real layout at
 * real lengths, which is the only way to judge a template. It is not approved
 * marketing copy and every price is invented.
 *
 * What must be replaced before launch:
 *   PRICING    every `engagement.from` figure. {{TODO: PRICING}}
 *   CLAIMS     anything stated as fact about past work that is not in
 *              content/case-studies.ts, which is the only real file here.
 *
 * Safe to keep and edit at leisure: section headings, problem framing, the
 * refusals. Those are positioning drafts, not claims of fact.
 */

export type ServicePage = {
  slug: string
  label: string
  /** Nav blurb — mirrors lib/site.ts, kept there as the single source. */
  hero: { title: string; lead: string }
  problem: string[]
  whatYouGet: string[]
  howItWorks: { title: string; body: string; meta: string }[]
  approach: { paragraphs: string[]; refuse: string[] }
  engagement: { shape: string; from: string; note: string }
  faqs: FAQ[]
  cta: string
  /** Case study categories that count as evidence for this service. */
  evidence: string[]
}

export const services: ServicePage[] = [
  {
    slug: 'ai-engineering',
    label: 'AI & Agentic Systems',
    hero: {
      title: 'We take the AI feature that works in your demo and make it survive production.',
      lead: 'Retrieval that returns the right document on the tenth thousand query, agents that fail loudly instead of silently, and an evaluation harness that tells you when a model change broke something.',
    },
    problem: [
      'The demo worked. You showed it to three customers, they liked it, and you started onboarding. Then real documents arrived — scanned, badly formatted, in four languages — and the answers got worse in ways nobody could reproduce.',
      'Now there is a prompt file nobody wants to touch, a vector database with no reindexing story, and a growing suspicion that the whole thing is held together by the two examples used during the build.',
      'The uncomfortable part is that you cannot tell whether it is getting better or worse, because there is nothing measuring it.',
    ],
    whatYouGet: [
      'A retrieval pipeline with documented chunking, embedding and reranking decisions',
      'An evaluation set built from your real queries, with pass rates per release',
      'Cost and latency instrumentation per request, broken down by model call',
      'Guardrails and fallbacks for the failure modes we find, not the generic ones',
      'A runbook for when a provider deprecates a model, because they will',
      'Handover session recorded, with the architecture notes in your repo',
    ],
    howItWorks: [
      {
        meta: 'Days 1–3',
        title: 'Read the code and the failures',
        body: 'We go through the pipeline and, more usefully, through the queries where it produced the wrong answer. Those are the specification.',
      },
      {
        meta: 'Days 4–7',
        title: 'Build the evaluation harness first',
        body: 'Before changing anything. Without a baseline every subsequent change is an opinion, and opinions are how these systems rot.',
      },
      {
        meta: 'Weeks 2–4',
        title: 'Fix retrieval, then generation',
        body: 'In that order, always. Most answer quality problems are retrieval problems wearing a prompt costume.',
      },
      {
        meta: 'Weeks 4–6',
        title: 'Instrument cost and latency',
        body: 'Per request, per model call. This is usually where somebody discovers a single endpoint is 60% of the bill.',
      },
      {
        meta: 'Final week',
        title: 'Handover',
        body: 'Architecture notes, the evaluation set, and a walkthrough with whoever owns it next. Recorded, because they will watch it twice.',
      },
    ],
    approach: {
      paragraphs: [
        'We start from the failure cases, not the architecture diagram. An agent framework choice matters far less than knowing which twenty queries embarrass you, and teams almost never have that list written down.',
        'We prefer boring, inspectable pipelines over frameworks that hide control flow. When a customer asks why the system said something, you need to be able to answer, and you cannot answer through four layers of abstraction you did not write.',
      ],
      refuse: [
        'We will not ship an agent with no evaluation set. It is not a system, it is a demo with a cron job.',
        'We will not fine-tune a model to paper over a retrieval problem, because it costs more and hides the actual fault.',
        'We will not build on a framework we cannot debug at 3am, however good the launch demo was.',
      ],
    },
    engagement: {
      shape: 'Audit first, then a fixed-scope build',
      from: '$18K',
      note: 'Most AI work starts with the Build Audit, because the difference between a two-week fix and a two-month rebuild is not visible from outside the repo.',
    },
    faqs: [
      {
        q: 'Can you work with the model provider we are already on?',
        a: 'Yes. We have shipped on OpenAI, Anthropic and open-weight models running on our clients own infrastructure. The provider is rarely the interesting decision — the retrieval and evaluation layers are, and they are mostly provider-agnostic.',
      },
      {
        q: 'What does this actually cost to run per month once it is live?',
        a: 'We instrument that during the build and hand you the numbers, because it is usually the question nobody asked before launch. For a mid-volume internal tool it is typically tens of dollars a month; for a customer-facing feature at scale it can be thousands, and the difference is almost always retrieval design rather than model choice.',
      },
      {
        q: 'Our accuracy is bad but we cannot say why. Is that something you can fix?',
        a: 'That is the normal starting point, and the first thing we build is the measurement, not the fix. Once there is an evaluation set built from your real queries, "bad" becomes a number and a list, and the list is usually shorter than people fear.',
      },
      {
        q: 'What if a model update breaks it after you leave?',
        a: 'That is what the evaluation harness is for. You run it, you see the pass rate drop, and you know before your customers do. The runbook covers pinning, rolling back and re-qualifying a new model version.',
      },
      {
        q: 'Will you use our data to train anything?',
        a: 'No. Data handling is written into the engagement: your data stays in your infrastructure, nothing is used for training, and we sign an NDA before repo access.',
      },
      {
        q: 'What if you find the whole approach is wrong?',
        a: 'We tell you in week one rather than month three, and we say what we would do instead and what it would cost. If that means the engagement is smaller than quoted, it is smaller than quoted.',
      },
    ],
    cta: 'Your AI feature works in the demo. Let us find out what happens at ten thousand queries.',
    evidence: ['Agentic AI', 'AI & Automation'],
  },
  {
    slug: 'product-build',
    label: 'Product & MVP Build',
    hero: {
      title: 'Zero to shipped, with the architecture decisions made once.',
      lead: 'A fixed scope, a fixed date, and three senior engineers who will still be on the project in month four. Not a discovery phase that bills for six weeks and produces a slide deck.',
    },
    problem: [
      'You have the product clear in your head and a deadline that came from somewhere real — a raise, a pilot customer, a conference. What you do not have is the eight weeks it takes to hire, or the tolerance for a team that needs three of them to learn your domain.',
      'The agencies you have spoken to want a paid discovery phase before they will quote. The freelancers are cheaper and available, but you have done that before and inherited the codebase to prove it.',
      'What you actually need is for the boring decisions — auth, data model, deploys, who gets paged — to be made once, correctly, by someone who has made them before.',
    ],
    whatYouGet: [
      'A working product in your repo and your cloud account, from the first commit',
      'Fixed scope, fixed price, fixed date, agreed before we start',
      'Weekly shipped increments you can click, not status reports',
      'Auth, payments, deploys and monitoring set up properly, not deferred',
      'Handover documentation written for the engineer who joins after us',
      'A defined support window after launch, with response times in writing',
    ],
    howItWorks: [
      {
        meta: 'Week 0',
        title: 'Scope and fix the price',
        body: 'One or two sessions. We write down what is in, what is explicitly out, and what the change-order process is. Then the number does not move.',
      },
      {
        meta: 'Week 1',
        title: 'Skeleton in production',
        body: 'Auth, database, CI and a deployed environment on day three, before any feature work. Deploying is not a phase at the end.',
      },
      {
        meta: 'Weeks 2–8',
        title: 'Weekly shipped increments',
        body: 'Every week ends with something on a real URL. You use it, we adjust. Nothing accumulates unseen for a month.',
      },
      {
        meta: 'Final two weeks',
        title: 'Load, edge cases, handover',
        body: 'The parts that get cut when a project is late, which is exactly why they are scheduled rather than hoped for.',
      },
    ],
    approach: {
      paragraphs: [
        'We build the deployment path before the features. A product that cannot be deployed on day three cannot be deployed on day ninety either, and every team that defers this pays for it during launch week.',
        'We choose unremarkable technology on purpose. Next.js, Postgres, a queue, a boring cloud account. The interesting part of your product should be your product, not the infrastructure holding it.',
      ],
      refuse: [
        'We will not start a build without a written scope, because that is how a fixed price becomes an argument.',
        'We will not add a microservice you do not need. Most products at this stage need one deployable and a good schema.',
        'We will not do pure UI design from scratch. We will build against a design, or build a clean functional interface, but we are not your brand studio.',
      ],
    },
    engagement: {
      shape: 'Fixed scope, fixed price',
      from: '$18K – $70K',
      note: 'The range is real: a focused internal tool and a customer-facing product with payments and roles are genuinely different jobs.',
    },
    faqs: [
      {
        q: 'What happens if we change our mind halfway through?',
        a: 'Small changes we absorb. Anything that moves the scope gets a written change order with a price and a date impact before we do the work, so you are never surprised by an invoice. Most projects have one or two; that is normal, not a failure.',
      },
      {
        q: 'What if it takes longer than you estimated?',
        a: 'On fixed-scope work, an overrun that is our estimating error is ours to absorb. An overrun caused by scope that was added is a change order. The distinction is written down before we start, which is the only time it can be discussed calmly.',
      },
      {
        q: 'Do we own the code?',
        a: 'Entirely, from the first commit. It lands in your GitHub organisation and your cloud account, with IP assignment signed before any code is written. There are no licence-back clauses.',
      },
      {
        q: 'Can you work with our existing designer?',
        a: 'Yes, and we prefer it. Give us Figma and we will build to it, flagging anything that will be expensive to implement before it becomes expensive.',
      },
      {
        q: 'What happens after launch?',
        a: 'A defined support window is included, with response times in writing. After that, either you take it in-house with the handover documentation, or we move to a retainer. Both are normal; we do not make leaving difficult.',
      },
      {
        q: 'Three people is not many. What if someone is ill?',
        a: 'Every project has two of the three across it, and everything is in your repo with documentation as we go. The honest limit is capacity, not resilience: we can only run a small number of builds at once, which is why the availability line on the homepage is real.',
      },
    ],
    cta: 'You have a date and a scope. Let us tell you honestly whether it fits.',
    evidence: ['SaaS Platform', 'Web3 Platform'],
  },
  {
    slug: 'build-rescue',
    label: 'Build Rescue',
    hero: {
      title: 'The build is 70% done and it has been 70% done for four months.',
      lead: 'Inherited codebases, stalled AI-tool MVPs, and the contractor who understood it and left. We find out what is actually wrong, tell you plainly, and then fix it.',
    },
    problem: [
      'Somebody built most of it. Maybe an agency, maybe a contractor who has moved on, maybe an AI coding tool that got you further than you expected and then hit a wall it could not see.',
      'Every estimate for finishing it comes back longer than the last one. Nobody can tell you whether the problem is the plan, the people, or the architecture — and the people you are asking have an interest in the answer.',
      'Meanwhile the demo still works, which makes it hard to explain to anyone why it is not shipping.',
    ],
    whatYouGet: [
      'A written assessment of what is actually wrong, in priority order',
      'A rebuild-versus-repair recommendation with the reasoning shown',
      'The critical path to a shippable state, with realistic dates',
      'A risk register: what breaks first, and what it takes down with it',
      'Working code, once you decide to proceed — not just a document',
      'Whatever we find, in writing, whether or not you hire us to fix it',
    ],
    howItWorks: [
      {
        meta: 'Day 1',
        title: 'NDA, repo access, environment',
        body: 'We get it running locally on day one. How long that takes is itself the first finding, and it is often the most revealing one.',
      },
      {
        meta: 'Days 2–4',
        title: 'Read everything, change nothing',
        body: 'Architecture, data model, dependencies, deploy path, test coverage. We are building an accurate picture before we have opinions about it.',
      },
      {
        meta: 'Days 5–8',
        title: 'Reproduce the failures',
        body: 'The bugs you can describe and the ones you have stopped mentioning because they seem unfixable. Both matter.',
      },
      {
        meta: 'Days 9–10',
        title: 'Report and walkthrough',
        body: 'Written findings, prioritised, with a repair-or-rebuild call and a number attached to each path. Then a call to argue with it.',
      },
      {
        meta: 'After',
        title: 'Fix it, or take the report elsewhere',
        body: 'The audit fee credits against a build if you proceed with us. If you take the report to another team instead, it still works — it is written to be useful, not to be a sales document.',
      },
    ],
    approach: {
      paragraphs: [
        'We start by getting it running, because the gap between the README and reality is the fastest measure of how a codebase has been maintained. A project that takes two days to run locally will take two weeks to onboard anybody.',
        'We do not recommend a rebuild by default. Rebuilds are the expensive answer that feels decisive, and roughly half the time the honest recommendation is that the architecture is fine and the problem is three specific things.',
        'When AI-generated code is involved, the pattern is consistent: the happy path is complete and the seams are not. Auth, permissions, error states, migrations and anything requiring a decision across two files. That is where we look first.',
      ],
      refuse: [
        'We will not quote a fix before reading the code. Anyone who does is guessing, and you will pay for the guess later.',
        'We will not recommend a rebuild to make the engagement bigger. It is in the report either way, with the reasoning shown so you can challenge it.',
        'We will not take over a codebase and then make ourselves the only people who understand it. That is the situation you are already in.',
      ],
    },
    engagement: {
      shape: 'Paid audit first, always',
      from: '$2,400',
      note: 'Fixed fee, ten working days, credited in full against a build if you proceed. This is the front door for almost every rescue.',
    },
    faqs: [
      {
        q: 'The last team told us it needs a full rebuild. Is that true?',
        a: 'Sometimes. Roughly half the time the architecture is survivable and the real problem is a short list of specific things, and the previous team was giving an honest answer to a question they had stopped being able to see clearly. The report shows the reasoning either way so you can push back on it.',
      },
      {
        q: 'It was built with Lovable, Bolt or Cursor. Is that a problem?',
        a: 'Not by itself, and we see it constantly. AI tools are good at the happy path and weak at the seams — permissions, error states, migrations, anything requiring a decision spanning several files. That is a known shape of problem, which makes it faster to assess than a codebase with a history nobody can explain.',
      },
      {
        q: 'What if you find nothing serious?',
        a: 'Then the report says so, you have the confidence you were paying for, and you should spend the build budget elsewhere. That is a good outcome and it happens more than you would think.',
      },
      {
        q: 'What if you find too much?',
        a: 'The report is prioritised precisely for that case: what has to be fixed to ship, what can wait, and what you can live with permanently. A hundred findings with no order is a document nobody acts on.',
      },
      {
        q: 'Do we have to hire you afterwards?',
        a: 'No, and the report is written to be useful to whoever does the work. If you take it to your in-house team or another agency, it will still make sense. The fee credits against a build only if you build with us.',
      },
      {
        q: 'Our previous developer is unreachable. Does that stop you?',
        a: 'No. That is the normal case rather than the exception, and it is why we read the code rather than interview the author. It does mean the first few days are slower, and the report will tell you honestly how much of the original intent was recoverable.',
      },
    ],
    cta: 'Find out what is actually wrong before you spend another quarter guessing.',
    evidence: ['Legal Tech', 'SaaS Platform'],
  },
  {
    slug: 'automation',
    label: 'Automation & Integrations',
    hero: {
      title: 'Workflows that remove headcount, not add dashboards.',
      lead: 'The manual process somebody does every morning, connected to the four systems it touches, running without them. Including the error handling, which is the part that decides whether anyone trusts it.',
    },
    problem: [
      'Someone in your team spends a chunk of every day moving data between systems that were each bought for a good reason and none of which talk to each other.',
      'You have tried the no-code tools. They work until an edge case arrives, and then they fail silently, and now there is a spreadsheet reconciling the automation nobody trusts.',
      'The work is not hard. It is just nobody senior has ever had a clear week to do it properly.',
    ],
    whatYouGet: [
      'The workflow running end to end, in your infrastructure',
      'Error handling and retries, with alerts that go to a human',
      'An audit trail of every run, so a disputed record can be traced',
      'Credentials and secrets managed properly, not pasted into a tool',
      'Documentation of every integration point and what breaks it',
      'A defined support window while it beds in',
    ],
    howItWorks: [
      {
        meta: 'Days 1–2',
        title: 'Watch the process being done',
        body: 'Literally. Screen-share with whoever does it today. The written process and the real one always differ, and the difference is where the edge cases live.',
      },
      {
        meta: 'Days 3–5',
        title: 'Map the systems and the failure modes',
        body: 'Which APIs, which rate limits, what happens when one is down mid-run. Deciding this up front is what separates an automation from a liability.',
      },
      {
        meta: 'Weeks 2–3',
        title: 'Build it, run it alongside',
        body: 'It runs in parallel with the manual process until the outputs match for a full cycle. Nobody switches off the old way on a promise.',
      },
      {
        meta: 'Week 4',
        title: 'Cut over and hand off',
        body: 'With the runbook, the alerting, and a named person who knows what to do when it pages them.',
      },
    ],
    approach: {
      paragraphs: [
        'We automate the process that exists, not the process on the org chart. The gap between them is where every failed automation project has died, and you only find it by watching someone do the work.',
        'Error handling is the deliverable. An automation that works 95% of the time and fails silently is worse than the manual process, because now nobody is checking and the errors compound quietly for a month.',
      ],
      refuse: [
        'We will not build an automation with no alerting. Silent failure is the only genuinely dangerous outcome here.',
        'We will not chain together no-code tools you will be unable to debug or afford at volume.',
        'We will not automate a process nobody has agreed on. That is an operations problem and automating it just makes it faster to be wrong.',
      ],
    },
    engagement: {
      shape: 'Fixed scope, per workflow',
      from: '$6K',
      note: 'Lowest ticket and highest volume of the five. Most clients start with one workflow and add more once the first has run unattended for a month.',
    },
    faqs: [
      {
        q: 'We already use Zapier or Make. Why would we pay for this?',
        a: 'If it works, keep it — genuinely. You are the right client for this when you have hit the ceiling: volume pricing that no longer makes sense, an edge case the tool cannot express, or a silent failure that cost you something. Below that line the no-code tool is the correct answer and we will say so.',
      },
      {
        q: 'What happens when one of the APIs changes?',
        a: 'The integration points and their assumptions are documented, and the alerting tells you the run failed rather than letting it pass quietly. Provider changes are a when, not an if, so the design assumes them.',
      },
      {
        q: 'Can it run in our infrastructure rather than yours?',
        a: 'Yes, and that is the default. It runs in your cloud account with your credentials from day one. We do not host things on your behalf that you then cannot move.',
      },
      {
        q: 'How do we know it is actually working?',
        a: 'Every run is logged with its inputs, outputs and duration, and failures alert a human. For the first month it runs alongside the manual process so the outputs can be compared before anyone relies on it.',
      },
    ],
    cta: 'Somebody on your team is doing this by hand every morning. Let us take it off them.',
    evidence: ['AI & Automation'],
  },
  {
    slug: 'cloud-devops',
    label: 'Cloud & DevOps',
    hero: {
      title: 'Infrastructure you can hand to someone else and they understand it.',
      lead: 'Deploys that are boring, environments that match, costs you can explain, and an on-call story that does not depend on one person being awake.',
    },
    problem: [
      'Deploys happen when one specific person is available. Staging and production have drifted apart in ways nobody has fully mapped. The cloud bill went up 40% and the honest answer to why is a shrug.',
      'None of it is on fire, which is exactly why it never gets fixed — until an outage or an enterprise security questionnaire makes it urgent on someone else’s schedule.',
    ],
    whatYouGet: [
      'Infrastructure as code, in your repo, with the manual steps eliminated',
      'A deploy anyone on the team can run, including a rollback',
      'Environments that actually match, with the differences documented',
      'Cost breakdown by service, with the three biggest line items explained',
      'Monitoring and alerts wired to a real destination',
      'A runbook for the failures we can predict',
    ],
    howItWorks: [
      {
        meta: 'Days 1–3',
        title: 'Map what exists',
        body: 'Including the parts created by hand two years ago that nobody has touched since. Those are usually the interesting ones.',
      },
      {
        meta: 'Week 1',
        title: 'Codify it',
        body: 'What exists goes into version control before anything is improved, so there is a known-good state to return to.',
      },
      {
        meta: 'Weeks 2–3',
        title: 'Fix the deploy path and the drift',
        body: 'One command, any environment, with a rollback that has been tested rather than assumed.',
      },
      {
        meta: 'Week 4',
        title: 'Monitoring, cost, handover',
        body: 'Alerts that mean something, a cost breakdown, and the runbook. Handed to your team, not retained by us.',
      },
    ],
    approach: {
      paragraphs: [
        'We codify what exists before improving it. Rewriting infrastructure while it is undocumented is how a Tuesday becomes an outage, and the intermediate state is worth having on its own.',
        'We optimise for the team you have. A Kubernetes cluster that nobody on staff can operate is a liability dressed as a best practice; most teams at this size want a managed platform, one deployable and a good pipeline.',
      ],
      refuse: [
        'We will not introduce infrastructure your team cannot run without us. That is a dependency, not a deliverable.',
        'We will not migrate cloud providers to save 15%. The migration costs more than the saving and the estimate is always optimistic.',
        'We will not set up alerting that pages people for things they cannot act on. That is how alerts get muted.',
      ],
    },
    engagement: {
      shape: 'Fixed scope, or retainer',
      from: '$9K',
      note: 'The support tier. Often bought alongside a build rather than on its own, and that is usually the right way round.',
    },
    faqs: [
      {
        q: 'Do we need Kubernetes?',
        a: 'Almost certainly not. At the size most of our clients are, a managed platform and one deployable is faster, cheaper and operable by the team you actually have. We will tell you the day that stops being true.',
      },
      {
        q: 'Can you reduce our cloud bill?',
        a: 'Usually, and the first step is making it legible rather than smaller. Most surprises are one service or one badly-shaped query, and until the bill is broken out by cause, cost work is guessing.',
      },
      {
        q: 'We have an enterprise security questionnaire we cannot answer. Can you help?',
        a: 'Yes, and it is a common reason people arrive here. Much of it is documentation of controls that already exist, and the rest is a short list of real gaps worth closing regardless of the deal.',
      },
      {
        q: 'What happens when you leave?',
        a: 'Everything is in your repo and your cloud account, and the runbook is written for someone who was not in the room. That is the test we hold it to.',
      },
    ],
    cta: 'Nothing is on fire. That is the cheapest possible time to fix this.',
    evidence: ['Web3 Platform', 'SaaS Platform'],
  },
]

export function getService(slug: string) {
  return services.find((service) => service.slug === slug)
}
