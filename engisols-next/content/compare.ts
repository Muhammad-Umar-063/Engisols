import type { FAQ } from '@/components/sections/shared'

export type ComparePage = {
  slug: string
  label: string
  alternative: string
  hero: { title: string; lead: string }
  tldr: string[]
  table: [string, string, string][]
  dimensions: { title: string; body: string }[]
  whenTheyWin: string[]
  whenWeWin: string[]
  faqs: FAQ[]
  cta: string
}

export const comparePages: ComparePage[] = [
  {
    "slug": "ai-coding-tools",
    "label": "vs AI coding tools",
    "alternative": "AI coding tools",
    "hero": {
      "title": "Keep the prototype moving. Know what still needs review.",
      "lead": "AI tools and engineering support can be used together. Choose the next step by looking at the application, the work remaining, and who can verify it."
    },
    "tldr": [
      "An AI coding tool can help explore and implement ideas. The resulting application still needs someone to assess its behavior against the requirements.",
      "A scoped engineering engagement is useful when you need help investigating failures, making architecture decisions, or implementing and validating the remaining work."
    ],
    "table": [
      [
        "What you choose",
        "A development tool and workflow",
        "An agreed engineering scope"
      ],
      [
        "Who reviews the result",
        "You or your engineering team",
        "Review responsibilities defined in the scope"
      ],
      [
        "Cost basis",
        "Tool costs and the time spent using it",
        "A project-specific proposal"
      ],
      [
        "Useful context",
        "Your requirements, code, and feedback",
        "Your product, existing system, and blocked work"
      ]
    ],
    "dimensions": [
      {
        "title": "Inspect the application",
        "body": "Judge the current system by its behavior: permissions, data handling, important user journeys, deployment, and recovery from failures."
      },
      {
        "title": "Define the next decision",
        "body": "A targeted review can help when the work is blocked and the options are unclear. A small implementation task may need a narrower scope."
      }
    ],
    "whenTheyWin": [
      "You are exploring an idea and can assess the output.",
      "Your team already owns testing, review, and operation.",
      "The task is narrow and feedback is quick."
    ],
    "whenWeWin": [
      "A failure needs investigation across the system.",
      "You need help deciding what to repair or replace.",
      "The remaining engineering work needs a defined owner."
    ],
    "faqs": [
      {
        "q": "How should I compare proposals?",
        "a": "Compare the scope, assumptions, deliverables, team, review process, and handover requirements. A price without those details does not describe the same work."
      },
      {
        "q": "Can I discuss the project before deciding?",
        "a": "Yes. Send the product context, the blocked work, and any constraints. An inquiry does not purchase an engagement."
      }
    ],
    "cta": "Tell us about the work so we can discuss whether it fits."
  },
  {
    "slug": "in-house-hire",
    "label": "vs In-house hire",
    "alternative": "an in-house hire",
    "hero": {
      "title": "Permanent ownership or a defined piece of work?",
      "lead": "Start with the duration, context, and responsibility the role needs. Hiring and a scoped engagement solve different problems."
    },
    "tldr": [
      "An in-house engineer can build continuing product and organizational knowledge. That can be valuable when the work is an enduring part of the business.",
      "A scoped engagement can help address a particular review, build, or integration. It needs clear boundaries and a handover plan."
    ],
    "table": [
      [
        "Relationship",
        "Employee within your organization",
        "External project engagement"
      ],
      [
        "Primary scope",
        "Continuing responsibilities",
        "Agreed deliverables or capacity"
      ],
      [
        "Cost basis",
        "Your hiring and employment costs",
        "The proposed engagement terms"
      ],
      [
        "Continuity",
        "Part of the internal team",
        "Defined handover and support arrangements"
      ]
    ],
    "dimensions": [
      {
        "title": "Duration and ownership",
        "body": "Consider whether the need is a bounded delivery problem or a lasting responsibility requiring daily product context."
      },
      {
        "title": "Internal support",
        "body": "Both paths need access to domain knowledge and decisions. Hiring also requires the management and collaboration structures that help the person succeed."
      }
    ],
    "whenTheyWin": [
      "The responsibility is a permanent part of your product team.",
      "The work depends on continuous internal context.",
      "You want to build long-term engineering capacity."
    ],
    "whenWeWin": [
      "A defined project needs additional engineering support.",
      "You need a review before committing to a larger plan.",
      "You want a scoped deliverable with an agreed handover."
    ],
    "faqs": [
      {
        "q": "How should I compare proposals?",
        "a": "Compare the scope, assumptions, deliverables, team, review process, and handover requirements. A price without those details does not describe the same work."
      },
      {
        "q": "Can I discuss the project before deciding?",
        "a": "Yes. Send the product context, the blocked work, and any constraints. An inquiry does not purchase an engagement."
      }
    ],
    "cta": "Tell us about the work so we can discuss whether it fits."
  },
  {
    "slug": "offshore-dev-shop",
    "label": "vs Offshore dev shop",
    "alternative": "a larger development agency",
    "hero": {
      "title": "Compare the delivery model, not the location.",
      "lead": "Team size alone does not tell you who will make decisions, review the work, or respond when a requirement changes."
    },
    "tldr": [
      "A larger agency may suit a project that needs several disciplines or parallel workstreams. Assess the actual team and delivery arrangements.",
      "For any engineering partner, ask to see relevant work and establish who owns the scope, technical decisions, reviews, and handover."
    ],
    "table": [
      [
        "Team",
        "Confirm the people assigned to your project",
        "Confirm the proposed engineering capacity"
      ],
      [
        "Relevant experience",
        "Review work by the proposed team",
        "Review the published case studies"
      ],
      [
        "Communication",
        "Agree contacts and review cadence",
        "Agree contacts and review cadence"
      ],
      [
        "Commercial terms",
        "Assess the written proposal",
        "Assess the written proposal"
      ]
    ],
    "dimensions": [
      {
        "title": "Who does the work",
        "body": "Ask who will be involved and how technical decisions and changes will be communicated. A proposal should make those responsibilities clear."
      },
      {
        "title": "How progress is inspected",
        "body": "Discuss access to working software, the repository, and the decision record. A status report alone may not answer the questions you need to resolve."
      }
    ],
    "whenTheyWin": [
      "The project requires multiple disciplines under one supplier.",
      "Several workstreams need to run in parallel.",
      "The proposed team has the specific capacity and experience you need."
    ],
    "whenWeWin": [
      "The problem matches our published engineering experience.",
      "You need a focused review or implementation scope.",
      "The proposed working arrangement fits your product team."
    ],
    "faqs": [
      {
        "q": "How should I compare proposals?",
        "a": "Compare the scope, assumptions, deliverables, team, review process, and handover requirements. A price without those details does not describe the same work."
      },
      {
        "q": "Can I discuss the project before deciding?",
        "a": "Yes. Send the product context, the blocked work, and any constraints. An inquiry does not purchase an engagement."
      }
    ],
    "cta": "Tell us about the work so we can discuss whether it fits."
  },
  {
    "slug": "upwork-toptal",
    "label": "vs Marketplace freelancers",
    "alternative": "a marketplace freelancer",
    "hero": {
      "title": "Hire a specialist or scope the engineering work together.",
      "lead": "A freelancer can be a good fit for a well-defined task. Broader product work also needs technical coordination and ownership."
    },
    "tldr": [
      "An individual specialist can help when the task and acceptance criteria are clear and you can manage the surrounding product decisions.",
      "An engineering engagement can be useful when the problem spans several parts of a system and needs diagnosis, planning, and implementation together."
    ],
    "table": [
      [
        "Starting point",
        "A role or task for an individual",
        "A product problem or defined scope"
      ],
      [
        "Coordination",
        "Agree responsibilities with the specialist",
        "Agree project ownership in the proposal"
      ],
      [
        "Evidence",
        "Review the individual’s relevant work",
        "Review published project work"
      ],
      [
        "Cost basis",
        "The individual’s terms",
        "The engagement proposal"
      ]
    ],
    "dimensions": [
      {
        "title": "Task clarity",
        "body": "A bounded task is easier to brief and evaluate. When the cause of a problem is unknown, begin with an investigation rather than a list of assumed fixes."
      },
      {
        "title": "Integration and review",
        "body": "Decide who will review the work, integrate it into the wider product, and operate it after delivery. Those responsibilities exist whichever hiring path you choose."
      }
    ],
    "whenTheyWin": [
      "The task has clear inputs, outputs, and acceptance criteria.",
      "You can provide technical direction and review.",
      "You need a particular specialist skill."
    ],
    "whenWeWin": [
      "The problem needs investigation before implementation.",
      "Changes span the application, integrations, and deployment.",
      "You want to agree a review and delivery plan together."
    ],
    "faqs": [
      {
        "q": "How should I compare proposals?",
        "a": "Compare the scope, assumptions, deliverables, team, review process, and handover requirements. A price without those details does not describe the same work."
      },
      {
        "q": "Can I discuss the project before deciding?",
        "a": "Yes. Send the product context, the blocked work, and any constraints. An inquiry does not purchase an engagement."
      }
    ],
    "cta": "Tell us about the work so we can discuss whether it fits."
  }
]

export function getComparePage(slug: string) {
  return comparePages.find((page) => page.slug === slug)
}
