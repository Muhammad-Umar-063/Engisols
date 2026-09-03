import type { FAQ } from '@/components/sections/shared'

/**
 * ⚠️  DEMO CONTENT — drafted, not signed off. See content/services.ts header.
 *
 * Content spec section 12: four comparison pages, seven sections each. The
 * order matters — TLDR first, because most readers of a comparison page read
 * two sentences and leave, and `WhenTheyWin` before `WhenWeWin`, because a
 * comparison that never concedes anything is read as marketing and discarded.
 *
 * `ai-coding-tools` is the highest-value page on the site: it targets founders
 * who built on Lovable, v0, Bolt, Base44 or Cursor and are now stuck, which is
 * exactly the audience the paid funnel is built around.
 */

export type ComparePage = {
  slug: string
  label: string
  /** The alternative, named as the reader would name it. */
  alternative: string
  hero: { title: string; lead: string }
  tldr: string[]
  /** [dimension, them, us] */
  table: [string, string, string][]
  dimensions: { title: string; body: string }[]
  whenTheyWin: string[]
  whenWeWin: string[]
  faqs: FAQ[]
  cta: string
}

export const comparePages: ComparePage[] = [
  {
    slug: 'ai-coding-tools',
    label: 'vs AI coding tools',
    alternative: 'AI coding tools',
    hero: {
      title: 'You got to 70% with an AI coding tool. Here is what the last 30% actually costs.',
      lead: 'Lovable, v0, Bolt, Base44 and Cursor are genuinely good at the first two weeks. This is an honest account of where they stop, and what to do when you are already past that line.',
    },
    tldr: [
      'AI coding tools will get a working prototype in front of customers faster than any agency, including us, and for a fraction of the price. Use them for that.',
      'They stall at the seams — permissions, migrations, error states, anything requiring a consistent decision across many files — and the stall arrives suddenly, usually the week you start onboarding real users.',
    ],
    table: [
      ['Speed to first demo', 'Hours', 'Two to three weeks'],
      ['Cost to prototype', 'Effectively nothing', '$18K and up'],
      ['Cost to production', 'Unbounded, and invisible up front', 'Fixed and quoted'],
      ['Handles auth and permissions', 'Partially, inconsistently', 'Yes'],
      ['Handles data migrations', 'No', 'Yes'],
      ['Someone accountable at 3am', 'No', 'Yes'],
      ['Best for', 'Proving the idea', 'Shipping the thing'],
    ],
    dimensions: [
      {
        title: 'Speed',
        body: 'Not a contest. A competent founder with Lovable will have something clickable this afternoon, and we will not. If you are still testing whether anyone wants this, that speed is worth more than everything below.',
      },
      {
        title: 'The 70% wall',
        body: 'The pattern is consistent enough to predict. The happy path is complete and the seams are not: a permission that is checked in three places and missed in the fourth, a schema change with no migration path, an error state that renders a blank screen. Each is small. Together they are the difference between a demo and a product.',
      },
      {
        title: 'Cost',
        body: 'The prototype is nearly free and the last 30% is not, which is what makes the total so hard to see in advance. The honest comparison is not tool-versus-agency, it is prototype-plus-rescue versus build. If the idea is unproven, the first path is still cheaper.',
      },
      {
        title: 'Code you can hand over',
        body: 'Generated code is often readable and rarely coherent — patterns vary between files because each was generated in a different context. A new engineer can read any single file and still take three weeks to understand the system, and that cost lands on whoever you hire next.',
      },
      {
        title: 'Accountability',
        body: 'When the tool produces something subtly wrong, there is nobody to ask. That is fine at prototype stage and stops being fine the day you have customers with data in it.',
      },
    ],
    whenTheyWin: [
      'You are testing whether anyone wants this at all. Do not hire us to find that out.',
      'The audience is small and known, and a rough edge costs you a conversation rather than a customer.',
      'It is an internal tool for a handful of colleagues who will tolerate friction.',
      'You have more time than money and are willing to learn the tool properly.',
    ],
    whenWeWin: [
      'Real customers have data in it and losing it is a real event.',
      'You have hit the wall — auth, migrations, permissions, silent failures — and each fix is breaking something else.',
      'You are raising, and due diligence is going to read this codebase.',
      'You need a date you can commit to publicly.',
      'Somebody has to be accountable for it working at 3am.',
    ],
    faqs: [
      {
        q: 'Can you just fix what the tool built, or does it need starting again?',
        a: 'Usually fix. The honest split across the rescues we have run is roughly half repair, a third partial rebuild of specific subsystems, and the rest a genuine restart — and the restarts are nearly always projects that outgrew their original data model rather than projects that used AI badly.',
      },
      {
        q: 'Is AI-generated code worse than human code?',
        a: 'Not line by line, and that is what makes it deceptive. It is locally reasonable and globally inconsistent, because each file was generated without the others in view. The defects cluster at the boundaries rather than inside functions.',
      },
      {
        q: 'Do you use AI tools yourselves?',
        a: 'Yes, daily, with a senior engineer reading every line before it lands. The difference is not the tool, it is whether someone is accountable for the shape of the whole system.',
      },
      {
        q: 'How do we know which side of the line we are on?',
        a: 'The clearest signal is whether fixes are creating new breakage. Isolated bugs mean the architecture is holding. If every repair moves the problem somewhere else, the seams have gone, and that is what the Build Audit measures.',
      },
    ],
    cta: 'You are past the point the tool can take you. Find out exactly how far past.',
  },
  {
    slug: 'in-house-hire',
    label: 'vs In-house hire',
    alternative: 'an in-house hire',
    hero: {
      title: 'If you need this capability for the next three years, hire someone.',
      lead: 'A permanent senior engineer beats any agency on cost and context over a long enough horizon. The question is only whether your horizon is long enough, and whether you can wait out the hiring.',
    },
    tldr: [
      'For continuous need beyond about twelve months, an in-house senior is cheaper and better than us, and we will tell you so on the call.',
      'We are the right answer when the need is bounded, the start date matters more than the total, or you cannot yet write the job description because you do not know what is wrong.',
    ],
    table: [
      ['Time to productive', 'Three to six months', 'Two weeks'],
      ['Annual cost, loaded', '$120K–$220K', 'Per engagement'],
      ['Context after a year', 'Deep', 'Documented, not lived'],
      ['Risk if it is the wrong hire', 'High, and slow to fix', 'Ends with the engagement'],
      ['Breadth of stack', 'One or two areas', 'Three seniors, different areas'],
      ['Best for', 'Continuous long-term need', 'Bounded or urgent work'],
    ],
    dimensions: [
      {
        title: 'Time to productive',
        body: 'Search, notice period and ramp is three to six months before the first meaningful commit, and that is with a good process and no failed offers. If the deadline is inside that window, hiring does not solve this problem no matter how good the eventual hire is.',
      },
      {
        title: 'Cost over time',
        body: 'A senior engineer at full loaded cost is cheaper per month than any agency. Cross a year of continuous need and the arithmetic is not close. Under six months, the recruitment cost and ramp dominate and the comparison inverts.',
      },
      {
        title: 'The wrong-hire risk',
        body: 'A senior hire who is not working out takes months to recognise and months to resolve, during which the work is not happening. That risk is real and rarely priced into the comparison.',
      },
      {
        title: 'Knowing what to hire for',
        body: 'Writing a good job description requires knowing what is wrong. Teams with a stalled build frequently do not, and hire the specialism that matches the last symptom rather than the cause.',
      },
    ],
    whenTheyWin: [
      'The need is continuous and you can see it lasting beyond a year.',
      'The domain knowledge is the job, and it compounds by being in the building.',
      'You can wait three to six months without the delay costing you the opportunity.',
      'You have someone senior who can technically evaluate candidates.',
    ],
    whenWeWin: [
      'The work is bounded — a build, a rescue, a migration with an end state.',
      'The date is not negotiable and hiring cannot meet it.',
      'You do not yet know what is wrong, so you cannot write the job spec.',
      'You need three specialisms for six weeks, not one for three years.',
      'You want the first hire to inherit something documented rather than something stalled.',
    ],
    faqs: [
      {
        q: 'Can you help us hire, and then hand over?',
        a: 'Yes, and it is one of the better ways to use us. We build, we document, and the permanent hire arrives to a codebase with a readable history instead of a rescue. We will also sit in on technical interviews.',
      },
      {
        q: 'Is it not cheaper to hire a junior and supervise them?',
        a: 'Only if someone senior has the time to supervise, and in the teams that ask us this, that person is usually the founder and does not. Unsupervised junior work on a production system is how rescues start.',
      },
      {
        q: 'What if we hire someone halfway through your engagement?',
        a: 'Good. We will onboard them, and the handover is scheduled work rather than a favour. It is genuinely the outcome we prefer.',
      },
      {
        q: 'Why would you talk us out of hiring you?',
        a: 'Because an engagement taken on the wrong premise ends badly for both sides, and the referral from an honest no is worth more than the invoice.',
      },
    ],
    cta: 'Not sure which side of the line you are on? That is a twenty-minute conversation.',
  },
  {
    slug: 'offshore-dev-shop',
    label: 'vs Offshore dev shop',
    alternative: 'a larger offshore dev shop',
    hero: {
      title: 'We are also offshore. Here is what that usually costs you, and what we do about it.',
      lead: 'The objection is legitimate and worth answering directly rather than deflecting. Most of the risk in offshore delivery is structural, and most of it is fixable by not scaling.',
    },
    tldr: [
      'A large offshore shop wins on capacity and price per head, and it is the right call when the work is well-specified, parallel and large.',
      'The recurring failure is not location, it is the layer between you and the engineer: an account manager, a rotating bench, and a senior who sold the work and then left it to juniors.',
    ],
    table: [
      ['Team size available', '20–200', 'Three, deliberately'],
      ['Who you talk to', 'Account manager', 'The engineer writing it'],
      ['Who writes the code', 'Mixed, often junior', 'Three seniors only'],
      ['Rate per hour', 'Lower', 'Higher'],
      ['Cost per shipped feature', 'Frequently higher', 'Lower'],
      ['Timezone overlap', 'Varies, often minimal', 'Four fixed hours daily'],
      ['Best for', 'Large parallel scoped work', 'Small senior high-context work'],
    ],
    dimensions: [
      {
        title: 'The layer in between',
        body: 'The structural problem is the account manager. Requirements pass through someone whose job is the relationship rather than the system, and by the time a misunderstanding surfaces it is a sprint old. We do not have that role and will not add it.',
      },
      {
        title: 'Who actually writes it',
        body: 'The seniors in the pitch are frequently not the people on the keyboard. Ask directly who commits, and ask to meet them. The answer distinguishes shops far better than a portfolio does.',
      },
      {
        title: 'Rate versus cost',
        body: 'A lower hourly rate loses to the number of hours. Three seniors who understand the system deliver a feature in a week that a larger mixed team takes a month over, and the cheaper invoice is the more expensive project.',
      },
      {
        title: 'Overlap hours',
        body: 'Four hours of guaranteed overlap changes what is possible: a blocker raised at 10am is resolved that day rather than tomorrow. Below about two hours, every decision costs a day.',
      },
      {
        title: 'Capacity',
        body: 'This is where they genuinely win. They can put eight people on it next week and we cannot put four on it ever. If the work is large, parallel and specified, that is decisive.',
      },
    ],
    whenTheyWin: [
      'The work is large, well-specified and genuinely parallel.',
      'You need eight engineers next month and the spec is stable enough to hand over.',
      'You have an internal technical lead who can direct and review their output.',
      'Budget per head is the binding constraint.',
    ],
    whenWeWin: [
      'The work needs judgement rather than throughput.',
      'The spec is not fully known yet, so requirements will change mid-build.',
      'You have been through this once already and inherited the result.',
      'You want to talk to the person writing the code, by name.',
    ],
    faqs: [
      {
        q: 'You are offshore too. Why is your version different?',
        a: 'Structure rather than geography. No account manager, no bench, no juniors, and four fixed overlap hours daily. Those are the specific mechanisms that make offshore delivery fail, and they are all choices rather than consequences of location.',
      },
      {
        q: 'How do we know seniors do the work and not juniors?',
        a: 'There are three of us and you meet all three. There is no bench to rotate, which is the same reason our capacity is limited and the availability line on the homepage is real rather than scarcity theatre.',
      },
      {
        q: 'What about the timezone?',
        a: 'Four hours of overlap with US Eastern and UK, every working day, written into the engagement. Anything outside that is async with written updates you can read rather than attend.',
      },
      {
        q: 'What happens if communication breaks down?',
        a: 'Everything is in your repo and your cloud account from day one, with documentation as we go. Leaving costs you time, not access — which is the actual fear behind this question.',
      },
    ],
    cta: 'Ask any shop who writes the code and whether you can meet them. Then ask us.',
  },
  {
    slug: 'upwork-toptal',
    label: 'vs Upwork and Toptal',
    alternative: 'a marketplace freelancer',
    hero: {
      title: 'A marketplace is a great way to buy a task and a poor way to buy a system.',
      lead: 'For a well-specified piece of work with a clear finish line, a good freelancer is faster and cheaper than us. The difficulty is everything that spans more than one person or more than one month.',
    },
    tldr: [
      'For small, well-specified tasks, marketplaces win outright on price and speed to start, and we would use one ourselves.',
      'They struggle when the work needs continuity, architectural judgement, or more than one specialism, because the platform is built around discrete contracts rather than ownership.',
    ],
    table: [
      ['Time to start', 'Days', 'Two weeks'],
      ['Cost for a small task', 'Lowest available', 'Not competitive'],
      ['Vetting burden', 'Yours', 'None'],
      ['Continuity', 'Contract by contract', 'Through the engagement'],
      ['Architectural ownership', 'Rare', 'Explicit'],
      ['Multiple specialisms', 'Multiple contracts', 'Three seniors, one team'],
      ['Best for', 'Defined discrete tasks', 'Systems with a lifespan'],
    ],
    dimensions: [
      {
        title: 'Vetting',
        body: 'The variance on an open marketplace is enormous and the screening cost lands on you. Toptal narrows it for a premium, which is worth paying — but you are still evaluating individuals rather than a team that has shipped together.',
      },
      {
        title: 'Continuity',
        body: 'The contract ends and the context leaves with it. For a bounded task that is fine. For a system you intend to keep, you have bought a series of local decisions with nobody holding the shape of the whole.',
      },
      {
        title: 'Architecture nobody owns',
        body: 'Three good freelancers across six months produce three coherent bodies of work that do not agree with each other. Nobody is wrong; nobody was asked to own the seams. That is the codebase that arrives here.',
      },
      {
        title: 'Coordination cost',
        body: 'Multiple specialisms means multiple contracts, and the integration work between them is unassigned by default, which means it becomes yours.',
      },
    ],
    whenTheyWin: [
      'The task is small, specified and has an obvious finish line.',
      'You need a specific narrow skill for two weeks.',
      'You have the technical judgement to vet and review the work yourself.',
      'Budget is the binding constraint and the work does not have to survive long.',
    ],
    whenWeWin: [
      'The system has to outlive the contract.',
      'You need architecture, build and infrastructure to agree with each other.',
      'You do not have time or context to vet, brief and review individuals.',
      'You have already tried this and are now holding the integration problem.',
    ],
    faqs: [
      {
        q: 'Toptal screens for seniority. Is that not the same as your three seniors?',
        a: 'Individually, often yes. The difference is that you are hiring a person into your problem rather than a team that has shipped together, so integration, review and architectural continuity remain your job.',
      },
      {
        q: 'Can you work alongside freelancers we already have?',
        a: 'Yes, and it is common. We usually take the architecture and the seams and leave feature work with people who already know the domain, which is a reasonable division of labour.',
      },
      {
        q: 'Why so much more expensive for the same hours?',
        a: 'You are not buying the same hours. Three seniors who have shipped together, with the review and architecture included rather than left to you, is a different product from an individual contractor — and for a small task it is genuinely the wrong one.',
      },
      {
        q: 'We have inherited a codebase from several freelancers. Where do we start?',
        a: 'The Build Audit. That specific shape — several coherent bodies of work that disagree at the boundaries — is what it is designed to map, and it is one of the most common reasons people arrive here.',
      },
    ],
    cta: 'If it is one clear task, use a marketplace. If it is a system, talk to us first.',
  },
]

export function getComparePage(slug: string) {
  return comparePages.find((page) => page.slug === slug)
}
