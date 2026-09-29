import type { FAQ } from '@/components/sections/shared'

/** Industry capabilities. Only sectors with published client evidence are indexed. */

export type IndustryPage = {
  slug: string
  label: string
  /** False where no case study in this vertical exists yet. */
  evidenced: boolean
  /** Case study categories that count as evidence here. */
  evidence: string[]
  hero: { title: string; lead: string }
  problems: { title: string; body: string }[]
  whatWeBuild: string[]
  constraints: { title: string; body: string }[]
  faqs: FAQ[]
  cta: string
}

export const industries: IndustryPage[] = [
  {
    "slug": "legal",
    "label": "Legal",
    "evidenced": true,
    "evidence": [
      "Legal Tech"
    ],
    "hero": {
      "title": "Clear workflows for complex legal processes.",
      "lead": "Intake, document generation, and review workflows. Our SoloSuit case study describes engineering contributed to a client’s legal technology platform."
    },
    "problems": [
      {
        "title": "Rules that vary by jurisdiction",
        "body": "Keep supported rules, document formats, and deadlines explicit so they can be reviewed and tested."
      },
      {
        "title": "Documents that need review",
        "body": "Build review steps, version history, and correction paths into document generation."
      },
      {
        "title": "Users under time pressure",
        "body": "Make the next step clear, preserve entered information, and explain errors in plain language."
      },
      {
        "title": "Sensitive documents and access",
        "body": "Define who can view or change a record, and how access and retention are managed."
      }
    ],
    "whatWeBuild": [
      "Guided intake and response workflows",
      "Document generation and version history",
      "Attorney review queues",
      "Rule and deadline configuration",
      "Case tracking and operational reporting"
    ],
    "constraints": [
      {
        "title": "Product and legal boundaries",
        "body": "Agree the product’s role and review requirements with the client’s legal team before implementation."
      },
      {
        "title": "Access and retention",
        "body": "Document access, audit logging, and retention requirements as part of the agreed technical scope."
      }
    ],
    "faqs": [
      {
        "q": "Can we see relevant work?",
        "a": "Yes. The SoloSuit case study describes our engineering contribution to guided legal workflows, document generation, and attorney review. SoloSuit is a client platform."
      },
      {
        "q": "Can you work with our legal team?",
        "a": "Include the people responsible for legal requirements and product approval in scoping. Their requirements inform the workflows and acceptance checks."
      },
      {
        "q": "How would you approach AI features?",
        "a": "Define the task, evaluation examples, review steps, and failure handling before deciding where AI is appropriate."
      }
    ],
    "cta": "Tell us about the legal workflow you want to improve."
  },
  {
    "slug": "saas",
    "label": "SaaS",
    "evidenced": true,
    "evidence": [
      "SaaS Platform",
      "AI & Automation"
    ],
    "hero": {
      "title": "Engineering for the product behind the subscription.",
      "lead": "Web applications, tenant permissions, billing workflows, and integrations for new and existing SaaS products."
    },
    "problems": [
      {
        "title": "Tenant boundaries",
        "body": "Make account ownership and data access explicit in the application and its tests."
      },
      {
        "title": "Subscription changes",
        "body": "Map trials, plan changes, failed payments, and cancellations alongside the user experience."
      },
      {
        "title": "Roles and permissions",
        "body": "Define what each role can see and do before adding administrative controls."
      },
      {
        "title": "Onboarding and daily use",
        "body": "Connect setup steps to a useful first result and make recurring tasks easy to complete."
      }
    ],
    "whatWeBuild": [
      "Web applications and APIs",
      "Tenant and role permissions",
      "Billing and subscription integrations",
      "Onboarding and administration flows",
      "Monitoring and operational tooling"
    ],
    "constraints": [
      {
        "title": "Data separation",
        "body": "Review how the product enforces tenant boundaries, including background jobs and administrative access."
      },
      {
        "title": "Operating requirements",
        "body": "Agree deployment, support, audit logging, and integration requirements as part of the scope."
      }
    ],
    "faqs": [
      {
        "q": "Can you work on an existing SaaS product?",
        "a": "Yes. Start with the current product, the work you need, and any technical documentation. An initial review helps establish the scope."
      },
      {
        "q": "Can you help with billing integrations?",
        "a": "We can scope payment-provider integrations and the application behavior around subscription changes, failed payments, and account access."
      },
      {
        "q": "Can we see relevant client work?",
        "a": "ProLyrics.ai and Alula are published client projects. Their case studies describe the product and engineering work."
      },
      {
        "q": "How is the delivery timeline set?",
        "a": "The estimate depends on the existing codebase, integrations, requirements, and review process. Timing is agreed in the proposal."
      }
    ],
    "cta": "Share the next milestone for your SaaS product."
  },
  {
    "slug": "real-estate",
    "label": "Real estate",
    "evidenced": false,
    "evidence": [],
    "hero": {
      "title": "Connect property data and day-to-day operations.",
      "lead": "Potential project areas include portfolio reporting, maintenance workflows, and integrations with existing property systems."
    },
    "problems": [
      {
        "title": "Information spread across tools",
        "body": "Identify the source of truth for properties, contacts, payments, and operational updates."
      },
      {
        "title": "Maintenance requests in several channels",
        "body": "Bring requests into a shared workflow with clear ownership and progress tracking."
      },
      {
        "title": "Dates and documents tracked manually",
        "body": "Make important dates, document versions, and follow-up tasks visible to the people responsible."
      }
    ],
    "whatWeBuild": [
      "Portfolio reporting and dashboards",
      "Maintenance intake and tracking",
      "Document and renewal reminders",
      "Property-system integrations",
      "Role-based access for operational teams"
    ],
    "constraints": [
      {
        "title": "Data access",
        "body": "Agree what owners, managers, contractors, and other users need to see."
      },
      {
        "title": "Integration availability",
        "body": "Check the existing system’s API, export options, permissions, and data quality before defining the integration."
      }
    ],
    "faqs": [
      {
        "q": "Can this connect to our current software?",
        "a": "That depends on the system and the access available. We review API and export options before proposing an integration."
      },
      {
        "q": "Who would maintain the software?",
        "a": "Administrative tools, documentation, operating responsibilities, and any ongoing support are agreed as part of the scope."
      },
      {
        "q": "How long would it take?",
        "a": "The timeline depends on the workflows, integrations, data migration, and rollout requirements. These are reviewed before estimating."
      },
      {
        "q": "Can we see a real estate case study?",
        "a": "We do not currently publish a real estate case study. This page describes project areas we can discuss and scope."
      }
    ],
    "cta": "Tell us which property workflow needs to work better."
  },
  {
    "slug": "healthcare",
    "label": "Healthcare",
    "evidenced": false,
    "evidence": [],
    "hero": {
      "title": "Software for care coordination and administration.",
      "lead": "Potential projects include intake, scheduling, and administrative workflows, with access, data handling, and review requirements defined during scoping."
    },
    "problems": [
      {
        "title": "Information moving between systems",
        "body": "Identify the records and updates each team needs, along with the permissions for exchanging them."
      },
      {
        "title": "Integration differences",
        "body": "Review the specific vendor, interface, contract, and test environment before planning an integration."
      },
      {
        "title": "Busy, interrupted workflows",
        "body": "Keep tasks clear, preserve progress, and make handoffs visible when people move between responsibilities."
      }
    ],
    "whatWeBuild": [
      "Administrative intake and scheduling",
      "Care coordination workflows",
      "Role-based dashboards",
      "Operational reporting",
      "Integrations with agreed data sources"
    ],
    "constraints": [
      {
        "title": "Privacy and governance requirements",
        "body": "Confirm the client’s requirements with the responsible compliance and governance teams before accepting sensitive data or implementing workflows."
      },
      {
        "title": "Administrative scope",
        "body": "Separate administrative requirements from clinical decision functionality when defining the engagement."
      }
    ],
    "faqs": [
      {
        "q": "How are compliance requirements handled?",
        "a": "The applicable requirements, responsibilities, data access, and contractual terms need to be established for the specific engagement. This page does not promise a certification or compliance outcome."
      },
      {
        "q": "Can you integrate with our EHR?",
        "a": "The vendor’s supported interfaces, permissions, and contract determine what is possible. We review these before proposing the work."
      },
      {
        "q": "What kind of healthcare software is in scope?",
        "a": "This page focuses on administrative and coordination workflows. Any request involving clinical decisions requires separate assessment."
      },
      {
        "q": "Can we see a healthcare case study?",
        "a": "We do not currently publish a healthcare-specific case study. The project areas here are for an initial scoping conversation."
      }
    ],
    "cta": "Share the administrative workflow you want to improve."
  },
  {
    "slug": "construction",
    "label": "Construction",
    "evidenced": false,
    "evidence": [],
    "hero": {
      "title": "Connect the office, the estimate, and the site.",
      "lead": "Potential project areas include estimating support, bid tracking, site reporting, and change-order workflows."
    },
    "problems": [
      {
        "title": "Manual estimating steps",
        "body": "Map repetitive work and the checks an estimator needs before deciding what to automate."
      },
      {
        "title": "Changes recorded in different places",
        "body": "Keep requests, approvals, and related documents together so the team can follow each change."
      },
      {
        "title": "Site updates that are hard to report on",
        "body": "Turn photos, notes, and progress updates into information the office and site team can use."
      }
    ],
    "whatWeBuild": [
      "Estimating and takeoff support",
      "Bid tracking and approvals",
      "Mobile site reports",
      "Change-order workflows",
      "Accounting and document integrations"
    ],
    "constraints": [
      {
        "title": "Connectivity on site",
        "body": "Define offline behavior, sync requirements, and recovery from interrupted connections where the workflow needs them."
      },
      {
        "title": "Document versions",
        "body": "Make drawing and specification versions visible, with an agreed process for updates and review."
      }
    ],
    "faqs": [
      {
        "q": "Could AI support our takeoffs?",
        "a": "A scoped evaluation can test whether it produces a useful first pass. The review process and acceptance checks should be defined before relying on the output."
      },
      {
        "q": "How would you design for site teams?",
        "a": "Start with the actual task, devices, connectivity, and time available. Test the flow with the people who will use it."
      },
      {
        "q": "Can it connect to our accounting system?",
        "a": "We first review the system’s supported interfaces, access permissions, and the records that need to move between tools."
      },
      {
        "q": "Can we see a construction case study?",
        "a": "We do not currently publish a construction case study. This page describes possible project areas to scope together."
      }
    ],
    "cta": "Tell us where information gets lost between office and site."
  },
  {
    "slug": "payroll-hr",
    "label": "Payroll & HR",
    "evidenced": false,
    "evidence": [],
    "hero": {
      "title": "Make payroll and people workflows easier to verify.",
      "lead": "Potential project areas include reconciliation, approvals, employee self-service, and integrations with existing payroll and HR systems."
    },
    "problems": [
      {
        "title": "Manual reconciliation",
        "body": "Compare records across systems and make discrepancies visible for review."
      },
      {
        "title": "Changing rules and configurations",
        "body": "Keep approved configuration changes traceable and test their effect on expected outputs."
      },
      {
        "title": "Errors found late in the process",
        "body": "Include validation and review steps before records move into downstream systems."
      }
    ],
    "whatWeBuild": [
      "Reconciliation and exception reporting",
      "Approval and review workflows",
      "Payroll and accounting integrations",
      "Employee self-service tools",
      "Change history and audit logging"
    ],
    "constraints": [
      {
        "title": "Verification and rollout",
        "body": "Agree representative test cases, reconciliation checks, and a staged rollout with the people responsible for payroll."
      },
      {
        "title": "Personal and financial data",
        "body": "Define permissions, data handling, retention, and integration access for the specific engagement."
      }
    ],
    "faqs": [
      {
        "q": "Can you integrate with our payroll provider?",
        "a": "We review the provider’s API or file exchange options, permissions, and test environment before proposing the integration."
      },
      {
        "q": "How would the workflow be tested?",
        "a": "The scope should include agreed examples, historical comparisons where appropriate, exception handling, and review by the responsible team."
      },
      {
        "q": "What about several countries?",
        "a": "Each location’s requirements and existing provider setup need to be assessed separately. The proposal should identify the supported scope and the people who approve those requirements."
      },
      {
        "q": "Can we see payroll-specific work?",
        "a": "We do not currently publish a payroll case study. The capabilities described here are potential project areas for discussion."
      }
    ],
    "cta": "Share the reconciliation or approval process you want to improve."
  }
]

export function getIndustry(slug: string) {
  return industries.find((industry) => industry.slug === slug)
}
