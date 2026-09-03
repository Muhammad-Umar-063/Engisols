# Engisols Content Specification

**Version:** 1.0
**Date:** 1 September 2026
**Companion to:** `engisols-build-spec.md`, `engisols-animation-spec.md`

Every page, every section, and what goes in it.

**Status note.** The homepage structure is locked. Everything else is proposed and needs your sign-off before build. Anything marked `{{TODO}}` must not be filled with invented content.

---

## How to read this

Each section entry gives a **name** (the component name, used in code) and a **description** (what content belongs there and why the section exists).

Sections marked **[shared]** are built once and reused. Do not rebuild them per page.

---

## Shared blocks

Build these first. They account for roughly 40 of the ~102 section instances across the site.

| Block | Used on | Content |
|---|---|---|
| `Header` | All | 5 nav items, mega menu, "Book a Build Audit" CTA |
| `Footer` | All | 4 columns, vertical links, legal, capacity line |
| `CTABlock` | 12 templates | One line of tension, one primary CTA to the Build Audit, one secondary to Contact. Copy varies per page context, structure does not. |
| `FAQAccordion` | 6 templates | Question and answer pairs. Questions written as the buyer would ask them, not as marketing prompts. |
| `CaseStudyGrid` | 5 templates | Card: client, industry, one hard number, thumbnail. Filterable on `/work` only. |
| `ProofStrip` | 4 templates | Client logos, markets served, AWS Solutions Architect certification |
| `TeamRow` | 3 templates | Three portraits, names, one line each |
| `ScanCapture` | 6 templates | Low-commitment entry point into the free repo and app health scan |

---

## 1. Home (`/`)

**Purpose:** convert cold traffic into a Build Audit booking or a scope submission.
**Primary CTA:** Book a Build Audit.
**Structure: locked.** 12 sections.

| # | Section | Content |
|---|---|---|
| 1 | `Hero` | Who you are and who this is for, in one sentence a stranger understands in three seconds. Working line: three senior engineers, no juniors, no account managers, no handoffs, shipping AI-native software for teams whose last build stalled. Two CTAs. Optional live capacity line. Background is a montage of real shipped product UIs. `{{TODO: POSITIONING}}` `{{TODO: CAPACITY}}` |
| 2 | `TrustStrip` **[shared]** | Client logos, markets served, AWS SA certification. Borrowed credibility in two seconds. `{{TODO: LOGOS}}` |
| 3 | `TheStall` | The pain in the buyer's own words. An MVP built on an AI coding tool that got to 70% and stopped. A last set of changes that never shipped. An AI feature that demos fine and breaks in production. Six to eight short lines, no paragraphs. This section is written to make one specific person feel recognised, not to be broadly agreeable. |
| 4 | `ProofBand` | Three to four verified figures with plain labels. Products shipped, years of combined experience, typical time to first deploy, markets served. Real numbers only. If a defensible trend metric exists, one animated line graph. If not, static figures and the graph is deleted. `{{TODO: PROOF_METRIC}}` |
| 5 | `Services` | Five tabs: AI and agentic systems, product and MVP build, build rescue, automation and integrations, cloud and DevOps. Each tab gets two sentences and one link through to its service page. Not a feature list. |
| 6 | `SelectedWork` | Four case studies, horizontal scroll. Each card: client name, industry, one hard number, thumbnail. `{{TODO: CASE_STUDIES}}` |
| 7 | `CapabilityGrid` | Sixteen stack tags, full bleed on cherry. No copy beyond a short heading. The section's job is to be memorable and to silently prove frontend engineering ability. |
| 8 | `HowWeWork` | Six steps covering timezone overlap hours, who the client actually talks to, IP assignment, NDA, repo access from day one, and what happens if communication stalls. This is where the offshore objection is answered. Written as commitments, not as process theatre. |
| 9 | `TheThree` | Three portraits, names, one line each on what they own. This is the differentiator, so it is a section rather than a footnote. `{{TODO: TEAM}}` |
| 10 | `Pricing` | The offer ladder with real numbers and a "who it's for" line under each tier. `{{TODO: PRICING}}` |
| 11 | `ScopeEstimator` | Three questions: build stage, timeline, budget band. Qualifies before a call. |
| 12 | `Footer` **[shared]** | Four columns plus vertical links for internal linking |

---

## 2. Services hub (`/services`)

**Purpose:** route visitors to the right service page.
**5 sections.**

| Section | Content |
|---|---|
| `Hero` | One line on how Engisols engages, framed as five ways in rather than a capability dump |
| `ServiceGrid` | Five cards. Each: service name, who it's for, typical engagement shape, link. |
| `EngagementShapes` | Short block on the three ways work starts: audit first, fixed-scope build, ongoing retainer. Links to `/pricing`. |
| `SelectedWork` **[shared]** | Three case study cards |
| `CTABlock` **[shared]** | |

---

## 3. Service page (`/services/{slug}`) × 5

Five pages: `ai-engineering`, `product-build`, `build-rescue`, `automation`, `cloud-devops`.
**9 sections each.**

| Section | Content |
|---|---|
| `Hero` | The service named plainly, who it is for, and the outcome. No abstraction. "We take an AI feature that works in your demo and make it survive production traffic" beats "AI engineering excellence". |
| `TheProblem` | The specific failure state this service fixes, written from the buyer's side. Three to four short paragraphs. |
| `WhatYouGet` | Concrete deliverables. Repos, documentation, deployed environments, handover session, defined support window. Anything a client could point at and say they received it. |
| `HowItWorks` | Four to six steps with a realistic timeline attached to each. Honest ranges, not best cases. |
| `Approach` | The technical position. Which tools, which patterns, and importantly what you refuse to do and why. This is the section that separates you from a body shop. |
| `RelatedWork` **[shared]** | Two case studies from this service |
| `Engagement` | Price shape for this specific service, linking to `/pricing`. `{{TODO: PRICING}}` |
| `FAQAccordion` **[shared]** | Six questions. Include the awkward ones about cost, timeline slippage, and what happens if it goes wrong. |
| `CTABlock` **[shared]** | |

**Per-page emphasis:**

- **`build-rescue`** is the highest-value page given your funnel. Lead with inherited codebases, stalled AI-tool builds, and departed developers. Link prominently to `/compare/ai-coding-tools`.
- **`ai-engineering`** covers agentic systems, RAG, evals, and what production actually costs to run.
- **`product-build`** covers zero to MVP with a fixed scope.
- **`automation`** covers integrations and internal tooling. Lowest ticket, highest volume.
- **`cloud-devops`** is support-tier. Keep it short, it exists mainly for completeness and SEO.

---

## 4. Work index (`/work`)

**3 sections.**

| Section | Content |
|---|---|
| `Hero` | One line. Optional filter by industry and service. |
| `CaseStudyGrid` **[shared]** | All case studies. `{{TODO: CASE_STUDIES}}` |
| `CTABlock` **[shared]** | |

---

## 5. Case study (`/work/{slug}`) × 4

**9 sections each.** This template carries more sales weight than any page except the homepage.

| Section | Content |
|---|---|
| `Hero` | Client name, one-line outcome, and the single hardest number available. |
| `AtAGlance` | Metadata block: client, industry, engagement type, timeline, stack, team size. Mono type. Scannable in five seconds. |
| `Before` | The situation when they came to you. Be specific about what was broken. Vague setup makes the result unbelievable. |
| `WhatWeBuilt` | The actual work, with screenshots of real UI. |
| `TechnicalDecisions` | Two or three decisions you made and why, including a tradeoff you accepted. This is the section technical buyers read closely and it is the one most agencies skip. |
| `Results` | Numbers with context. What changed, over what period, measured how. |
| `ClientQuote` | One quote, attributed with name and role. Omit the section entirely rather than using an unattributed quote. |
| `RelatedWork` **[shared]** | Two others |
| `CTABlock` **[shared]** | |

**Blocker.** Four case studies need client name, industry, one hard number, and permission. If only two are cleared, ship two. Two real case studies beat four padded ones.

---

## 6. Industries hub (`/industries`)

**3 sections.**

| Section | Content |
|---|---|
| `Hero` | One line on why domain context matters for build speed |
| `IndustryGrid` | Six cards with a one-line problem statement each |
| `CTABlock` **[shared]** | |

---

## 7. Industry page (`/industries/{slug}`) × 6

Candidates from your shipped work: real estate, healthcare, legal, construction, payroll and HR, SaaS. `{{TODO: VERTICALS}}`
**7 sections each.**

| Section | Content |
|---|---|
| `Hero` | The industry named, with a problem statement someone in that industry would recognise |
| `IndustryProblems` | Three to four failure patterns specific to this sector |
| `WhatWeBuild` | The systems you have actually shipped here. Named, not hypothetical. |
| `Constraints` | Compliance, data handling, integrations, regulatory reality. Load-bearing for healthcare, legal and payroll. Thin or omitted for SaaS. |
| `RelatedWork` **[shared]** | At least two case studies from this industry |
| `FAQAccordion` **[shared]** | Four industry-specific questions |
| `CTABlock` **[shared]** | |

**Rule.** An industry page ships only if you have at least one real case study in it. An industry page with no evidence is worse than not having the page.

---

## 8. Pricing (`/pricing`)

**Purpose:** let buyers self-qualify before a call. This page does more conversion work than any animation on the site.
**7 sections.** `{{TODO: PRICING}}`

| Section | Content |
|---|---|
| `Hero` | The ladder in one sentence, with the position that you publish prices and most agencies do not |
| `TheLadder` | Three tiers. Each: name, price, duration, what is included, and a "who this is for" line. The free or low-cost entry point, the paid diagnostic, the build range. |
| `WhenWereWrong` | Who should not hire you. Under 12 months of continuous need favours an in-house hire. Small well-specified tasks favour a marketplace. This section costs you nothing and buys real credibility. |
| `HowBillingWorks` | Currency, payment schedule, milestones, what triggers a change order. Removes friction later. |
| `Guarantee` | The risk reversal on the paid diagnostic. Write the actual terms, not a slogan. |
| `FAQAccordion` **[shared]** | Six questions, all uncomfortable ones. Overruns, scope changes, disputes, what happens if you disappear. |
| `CTABlock` **[shared]** | |

---

## 9. Build Audit (`/pricing/build-audit`)

**Purpose:** the paid front door and the single conversion target of the site.
**9 sections.** This is a real landing page, not a pricing subpage.

| Section | Content |
|---|---|
| `Hero` | The offer stated flatly: what it costs, how long it takes, what you walk away with, and the guarantee. All four in the first screen. `{{TODO: PRICING}}` |
| `WhoThisIsFor` | Two columns. For you if: inherited a codebase, MVP stalled at 70%, AI feature fails in production, developer left. Not for you if: you need a design from scratch, you want staff augmentation, you have no code yet. |
| `TheDeliverable` | What the audit physically produces. A written report, a prioritised roadmap, a risk register, a walkthrough call. Show a redacted sample page if possible, because seeing the artifact converts better than describing it. |
| `HowItWorks` | Day by day across the engagement. NDA and repo access on day one, through to the handover call. |
| `WhyItsPaid` | Short and direct. A free audit is a sales call. A paid audit is work, which is why it is useful whether or not you hire us afterwards. |
| `Proof` **[shared]** | Case studies where an audit preceded a build |
| `Guarantee` | The full terms. |
| `FAQAccordion` **[shared]** | NDA, code confidentiality, what if we find nothing, what if we find too much, does the fee credit against a build |
| `Booking` | Real calendar embed, not a contact form. |

---

## 10. Process (`/process`)

**Purpose:** answer the offshore risk objection in depth.
**6 sections.**

| Section | Content |
|---|---|
| `Hero` | One line on working with a small remote team |
| `Phases` | Discovery, build, handover, support. What happens in each and roughly how long. |
| `Communication` | Timezone overlap hours by market, tools, response time commitments, and who the client talks to by name. |
| `LegalAndOwnership` | IP assignment, NDA, repo ownership from day one, what happens to code if the engagement ends early. |
| `WhatWeNeedFromYou` | Client-side obligations. Decision maker availability, access, review turnaround. Sets expectations both directions. |
| `CTABlock` **[shared]** | |

---

## 11. Compare hub (`/compare`)

**3 sections.** Hero, four comparison cards, CTA.

---

## 12. Compare page (`/compare/{slug}`) × 4

Four pages: `in-house-hire`, `offshore-dev-shop`, `upwork-toptal`, `ai-coding-tools`.
**7 sections each.**

| Section | Content |
|---|---|
| `TLDR` | Two sentences answering the question directly, before any argument. Many readers only read this. |
| `AtAGlanceTable` | Five to seven dimensions: speed to start, cost, risk, code ownership, seniority, ongoing support, best for. |
| `DimensionBreakdown` | One short section per dimension with real reasoning rather than a checkmark. |
| `WhenTheyWin` | Genuine cases where the alternative is the better choice. Written without hedging. This section is why the page is believable. |
| `WhenWeWin` | The specific situations where you are the right answer. |
| `Proof` **[shared]** | One or two relevant case studies |
| `CTABlock` **[shared]** | Routes to the Build Audit |

**Priority.** `ai-coding-tools` is your highest-value page. It targets exactly the founders who built on Lovable, v0, Bolt, Base44 or Cursor and are now stuck, which is the audience your paid funnel is built around. Write it first, and link it from the homepage stall section and the build-rescue service page.

---

## 13. About (`/about`)

**6 sections.** `{{TODO: TEAM}}`

| Section | Content |
|---|---|
| `Hero` | The premise: three senior engineers, deliberately not scaling into a body shop |
| `TeamRow` **[shared]** | Three portraits, names, what each owns, one specific thing each has shipped |
| `WhyWeWorkThisWay` | The argument for a three-person senior team over a fifteen-person mixed one. Honest about the ceiling this imposes on capacity. |
| `HowWeGotHere` | Short origin. Specific and dated, not a founding myth. |
| `WhatWeDont` | Pure UI and UX design from scratch, staff augmentation, anything you cannot staff with a senior. Naming your limits reads as confidence. |
| `CTABlock` **[shared]** | |

---

## 14. Blog index (`/blog`)

**4 sections.** Hero, featured post, post grid grouped by the four content pillars, `ScanCapture`.

## 15. Blog post (`/blog/{slug}`)

**5 sections.** Header with title and reading time, body, author block, related posts, `CTABlock`.

Zero posts at launch. Phase 4 builds the shell only.

---

## 16. Contact (`/contact`)

**4 sections.**

| Section | Content |
|---|---|
| `Hero` | One line |
| `Booking` | Calendar embed |
| `WhatHappensNext` | The three steps after booking, with timing. Reduces no-shows. |
| `DirectAlternatives` | Email, timezone, typical response time |

---

## 17. Legal (`/privacy`, `/terms`)

**2 sections each.** Header and body. Required for ad platforms and enterprise procurement.

## 18. 404

**1 section.** Short line, links to Work, Services and Home.

---

## 19. Scan funnel (proposed, not yet in the architecture)

Your paid-ads funnel targets non-technical founders with stalled AI-tool MVPs, using a free repo and app health scan as the lead magnet. The current site architecture has nowhere for it to live. Three URLs:

### `/scan` (7 sections)

| Section | Content |
|---|---|
| `Hero` | The scan offer: what it checks, how long it takes, what it costs (nothing), what you get |
| `WhatItChecks` | Specific checks by category: security, dependency risk, architecture, scalability, cost. Specificity is what makes a free tool credible. |
| `WhoItsFor` | Founders who built on Lovable, v0, Bolt, Base44, Cursor or Claude and are now stuck or scaling |
| `SampleReport` | A redacted example of the output |
| `Privacy` | What happens to their code, retention policy, NDA availability. This is the biggest objection to handing over a repo and it needs its own section. |
| `FAQAccordion` **[shared]** | |
| `ScanForm` | Repo URL or upload, email, one qualifying question |

### `/scan/results/{id}` (5 sections)

A product surface, not a marketing page. Findings summary with severity counts, findings detail grouped by category, a "what this means" plain-language block for non-technical founders, an estimated effort to fix, and a handoff to the paid audit. Needs its own technical spec.

### `/scan/next` (4 sections)

Post-scan handoff. Results recap, the case for the paid audit, guarantee, booking.

**Note.** The scan results view is genuinely a product, not a page. Do not let it get built as a marketing template.

---

## 20. Content sequencing

Not everything ships at once. Order by revenue impact.

| Wave | Pages | Why |
|---|---|---|
| 1 | Home, Build Audit, Contact, Legal | The conversion path. Nothing else earns money. |
| 2 | Work index, 2 to 4 case studies, Pricing, About | The proof layer. Wave 1 underperforms without it. |
| 3 | 5 service pages, Process | Depth for people already interested |
| 4 | `/compare/ai-coding-tools`, then the other 3 | Highest-intent organic traffic |
| 5 | Industry pages, Blog shell | Long tail |
| 6 | Scan funnel | Needs its own spec first |

Waves 1 and 2 are the site. Everything after is expansion.
