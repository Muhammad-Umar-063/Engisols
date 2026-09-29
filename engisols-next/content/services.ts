import type { FAQ } from '@/components/sections/shared'

export type ServicePage = {
  slug: string
  label: string
  hero: { title: string; lead: string }
  problem: string[]
  whatYouGet: string[]
  howItWorks: { title: string; body: string; meta: string }[]
  approach: { paragraphs: string[]; refuse: string[] }
  engagement: { shape: string; from: string; note: string }
  faqs: FAQ[]
  cta: string
  evidence: string[]
}

export const services: ServicePage[] = [
  {
    "slug": "ai-engineering",
    "label": "AI & Agentic Systems",
    "hero": {
      "title": "Make the AI feature work beyond the demo.",
      "lead": "Retrieval, agent workflows, and evaluations built around the data and failure cases your product actually encounters."
    },
    "problem": [
      "A convincing demo does not show how a system behaves with unfamiliar documents, incomplete inputs, or a model change.",
      "Start by identifying the outputs that matter and the failures you need to detect. That gives the engineering work a measurable target."
    ],
    "whatYouGet": [
      "Retrieval and data-flow design",
      "Evaluation cases drawn from product behavior",
      "Cost and latency instrumentation",
      "Documented fallbacks and operational guidance"
    ],
    "approach": {
      "paragraphs": [
        "A pipeline is easier to improve when its decisions and failures are visible. We favor clear retrieval boundaries and evaluations that reflect the product."
      ],
      "refuse": [
        "Treating a successful demo as proof of reliability.",
        "Using a framework that hides the behavior the team needs to inspect."
      ]
    },
    "engagement": {
      "shape": "Review or scoped implementation",
      "from": "Quoted for your scope",
      "note": "The data sources, evaluation needs, integrations, and operating constraints determine the work."
    },
    "faqs": [
      {
        "q": "Can you work with our current model provider?",
        "a": "Include your provider and infrastructure in the inquiry. We can then discuss the integration and any constraints before proposing changes."
      },
      {
        "q": "How do we measure improvement?",
        "a": "Use representative inputs and explicit acceptance criteria. An evaluation set provides a repeatable comparison between versions."
      },
      {
        "q": "How is private data handled?",
        "a": "Data access, hosting, retention, and provider settings need to be agreed for the engagement before private data is shared."
      }
    ],
    "cta": "Show us where the AI feature stops working.",
    "evidence": [
      "Agentic AI",
      "AI & Automation",
      "Legal Tech"
    ],
    "howItWorks": [
      {
        "meta": "Inspect",
        "title": "Review the current pipeline",
        "body": "Understand the inputs, retrieval steps, model calls, and known failure cases."
      },
      {
        "meta": "Measure",
        "title": "Establish an evaluation baseline",
        "body": "Define representative queries and the criteria used to judge their outputs."
      },
      {
        "meta": "Improve",
        "title": "Implement and compare",
        "body": "Evaluate changes against the baseline and inspect the failure cases that remain."
      },
      {
        "meta": "Operate",
        "title": "Prepare for change",
        "body": "Document model dependencies, monitoring, and the process for evaluating future changes."
      }
    ]
  },
  {
    "slug": "product-build",
    "label": "Product & MVP Build",
    "hero": {
      "title": "Build the product around the work your users need to do.",
      "lead": "Web applications, APIs, and integrations with the scope, delivery plan, and operating requirements considered together."
    },
    "problem": [
      "A product idea needs a clear first release: who it serves, what they can complete, and which requirements can wait.",
      "Existing designs, customer feedback, and technical constraints help turn that release into a scope that can be estimated."
    ],
    "whatYouGet": [
      "Product and technical scope",
      "Application and API implementation",
      "Testing and deployment plan",
      "Handover documentation"
    ],
    "approach": {
      "paragraphs": [
        "Architecture should make the product easier to change and operate. The technology choices should fit the scope and the team that will own it."
      ],
      "refuse": [
        "Promising a delivery date before understanding the dependencies.",
        "Adding infrastructure that does not solve a current product need."
      ]
    },
    "engagement": {
      "shape": "Scoped product build",
      "from": "Project-specific quote",
      "note": "The estimate depends on the user journeys, integrations, data, and release requirements."
    },
    "faqs": [
      {
        "q": "Can you work from our designs?",
        "a": "Yes. Share the designs and the important interaction requirements so implementation questions can be identified during scoping."
      },
      {
        "q": "What if the requirements change?",
        "a": "Changes should be assessed against the agreed scope and recorded with their effect on cost and timing."
      },
      {
        "q": "What happens after launch?",
        "a": "Handover and any ongoing support are defined in the proposal. Include your operating team and support needs in the initial discussion."
      }
    ],
    "cta": "Tell us what the first useful release needs to do.",
    "evidence": [
      "SaaS Platform",
      "Web3 Platform",
      "AI & Automation"
    ],
    "howItWorks": [
      {
        "meta": "Define",
        "title": "Choose the release boundary",
        "body": "Agree the user journeys, requirements, and exclusions."
      },
      {
        "meta": "Plan",
        "title": "Map the dependencies",
        "body": "Identify integrations, data requirements, deployment needs, and project decisions."
      },
      {
        "meta": "Build",
        "title": "Implement useful increments",
        "body": "Review working behavior as the agreed scope takes shape."
      },
      {
        "meta": "Validate",
        "title": "Prepare for release",
        "body": "Test the important journeys and agree how the product will be deployed and operated."
      }
    ]
  },
  {
    "slug": "build-rescue",
    "label": "Build Rescue",
    "hero": {
      "title": "Find the path from a stalled build to a working product.",
      "lead": "Review an inherited codebase, investigate the failures, and decide what to repair before committing to a rebuild."
    },
    "problem": [
      "The happy path may work while permissions, data handling, integrations, or deployment still prevent release.",
      "A useful next step is a diagnosis of the specific blockers and the decisions needed to move forward."
    ],
    "whatYouGet": [
      "Assessment of the agreed problem areas",
      "Prioritised repair recommendations",
      "Repair and rebuild options",
      "Implementation scope for the chosen path"
    ],
    "approach": {
      "paragraphs": [
        "A rebuild is one option, not the starting assumption. The review should distinguish code that is useful from the decisions and defects that block the product."
      ],
      "refuse": [
        "Recommending a rewrite without examining the existing system.",
        "Quoting a rescue from screenshots alone."
      ]
    },
    "engagement": {
      "shape": "Engineering review, then an agreed plan",
      "from": "Scoped quote",
      "note": "Begin with the codebase, known failures, and the decision you need the review to support."
    },
    "faqs": [
      {
        "q": "Does a stalled build need a full rewrite?",
        "a": "That depends on the system. A review can compare targeted repairs, partial replacement, and rebuilding with the tradeoffs explained."
      },
      {
        "q": "Can you review a build made with AI tools?",
        "a": "Yes. The relevant questions are how the resulting application behaves, how its data and permissions work, and how it can be tested and operated."
      },
      {
        "q": "Do we need to commit to implementation first?",
        "a": "No. Discuss the review scope and the decision it needs to support before considering a subsequent build."
      }
    ],
    "cta": "Describe the problem that keeps the build from shipping.",
    "evidence": [
      "AI & Automation",
      "SaaS Platform"
    ],
    "howItWorks": [
      {
        "meta": "Understand",
        "title": "Describe the blocker",
        "body": "Collect known failures and the result the product needs to achieve."
      },
      {
        "meta": "Inspect",
        "title": "Review the existing system",
        "body": "Examine the agreed code, architecture, dependencies, and deployment path."
      },
      {
        "meta": "Decide",
        "title": "Compare the options",
        "body": "Explain what can be retained and what needs to change, with assumptions made explicit."
      },
      {
        "meta": "Deliver",
        "title": "Work through the priorities",
        "body": "Agree an implementation scope and verify the behavior that was blocking progress."
      }
    ]
  },
  {
    "slug": "automation",
    "label": "Automation & Integrations",
    "hero": {
      "title": "Connect the systems behind the manual work.",
      "lead": "APIs, workflows, and background jobs that move information with clear ownership, visible failures, and a way to recover."
    },
    "problem": [
      "Manual copying between tools creates delays and makes the state of a process hard to trust.",
      "An integration needs more than a successful API request. It needs to handle duplicate events, failures, and changes in the connected systems."
    ],
    "whatYouGet": [
      "Workflow and integration design",
      "API and event-driven implementation",
      "Failure handling and operational visibility",
      "Documentation for the people running the workflow"
    ],
    "approach": {
      "paragraphs": [
        "The goal is a workflow people can rely on and understand. Clear state and recovery paths matter as much as reducing the number of manual steps."
      ],
      "refuse": [
        "Automating a process before its decision rules are understood.",
        "Silently dropping failures or relying on a single successful demonstration."
      ]
    },
    "engagement": {
      "shape": "Scoped integration or workflow",
      "from": "Quoted for your systems",
      "note": "The connected tools, API access, data quality, and recovery requirements determine the scope."
    },
    "faqs": [
      {
        "q": "Which systems can you connect?",
        "a": "Share the systems involved and the access or API documentation available. Feasibility depends on the interfaces and permissions each system provides."
      },
      {
        "q": "What happens when an integration fails?",
        "a": "The design should define retries, error reporting, and any manual recovery path appropriate to that workflow."
      },
      {
        "q": "Can AI be part of an automation?",
        "a": "Where useful, with clear input and output boundaries and a way to evaluate or review uncertain results."
      }
    ],
    "cta": "Show us the work that still moves between systems by hand.",
    "evidence": [
      "AI & Automation",
      "Agentic AI"
    ],
    "howItWorks": [
      {
        "meta": "Map",
        "title": "Follow the current workflow",
        "body": "Understand where information starts, who changes it, and which systems rely on it."
      },
      {
        "meta": "Design",
        "title": "Define the boundaries",
        "body": "Agree source-of-truth rules, permissions, and failure behavior."
      },
      {
        "meta": "Connect",
        "title": "Implement the workflow",
        "body": "Build the agreed connections and test representative and repeated events."
      },
      {
        "meta": "Operate",
        "title": "Make failures visible",
        "body": "Document monitoring, recovery, and the manual path when intervention is needed."
      }
    ]
  },
  {
    "slug": "cloud-devops",
    "label": "Cloud & DevOps",
    "hero": {
      "title": "Make deployment and operation part of the product.",
      "lead": "Cloud environments, delivery pipelines, and operational visibility shaped around the application and the team responsible for it."
    },
    "problem": [
      "A fragile deployment path makes even small product changes difficult to ship.",
      "The operational questions need explicit answers: what is running, what changed, how failures are noticed, and how the service recovers."
    ],
    "whatYouGet": [
      "Infrastructure and deployment review",
      "Agreed pipeline or environment changes",
      "Monitoring and operational documentation",
      "Handover and recovery requirements"
    ],
    "approach": {
      "paragraphs": [
        "Infrastructure should fit the workload and the people who operate it. Familiar, inspectable components are often more useful than additional layers of orchestration."
      ],
      "refuse": [
        "Adding operational complexity without a concrete requirement.",
        "Treating monitoring and handover as somebody else’s problem."
      ]
    },
    "engagement": {
      "shape": "Review or scoped infrastructure work",
      "from": "Project-specific quote",
      "note": "The environment, access, dependencies, and operating requirements shape the proposal."
    },
    "faqs": [
      {
        "q": "Do we need to change cloud providers?",
        "a": "That is a decision to investigate, not an assumption. Share the current environment and the constraints driving the work."
      },
      {
        "q": "Can you reduce our running costs?",
        "a": "A review can identify where costs arise and assess possible changes. Any expected savings depend on usage and the implementation."
      },
      {
        "q": "Is ongoing support included?",
        "a": "The proposal defines the operating responsibilities and any support arrangement. Describe those needs when you get in touch."
      }
    ],
    "cta": "Tell us what makes the next deployment difficult.",
    "evidence": [
      "Agentic AI",
      "Web3 Platform",
      "SaaS Platform"
    ],
    "howItWorks": [
      {
        "meta": "Review",
        "title": "Map the running system",
        "body": "Identify services, dependencies, access, and the current deployment process."
      },
      {
        "meta": "Prioritise",
        "title": "Choose the operational improvements",
        "body": "Focus the scope on the failure modes and constraints that affect the product."
      },
      {
        "meta": "Implement",
        "title": "Make changes inspectable",
        "body": "Build and validate the agreed infrastructure and deployment changes."
      },
      {
        "meta": "Handover",
        "title": "Prepare the operating team",
        "body": "Document the deployment path, monitoring, and recovery procedures in scope."
      }
    ]
  }
]

export function getService(slug: string) {
  return services.find((service) => service.slug === slug)
}
