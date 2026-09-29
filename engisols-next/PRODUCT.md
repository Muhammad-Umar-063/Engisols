# Engisols

Engisols is a software engineering practice. The public site helps people with a new idea, an existing product, or a stalled build understand the available work, inspect client contributions, and start a project conversation. This document records existing public content and the homepage refinement constraints; it adds no commercial promises or performance claims.

## Services

The five services are peer offerings and must remain equally visible. `lib/site.ts` owns the shared list; `content/services.ts` describes scope and limitations.

| Service | Published scope |
| --- | --- |
| AI & Agentic Systems | Retrieval, agent workflows, and evaluation on real data. |
| Product & MVP Build | Web products and MVPs, from scope to implementation. |
| Build Rescue | Review, repair, and move an existing codebase forward. |
| Automation & Integrations | Connect tools and reduce repetitive manual work. |
| Cloud & DevOps | Cloud infrastructure, deployment pipelines, and monitoring. |

Industry pages describe capabilities; they do not by themselves establish a completed engagement, regulatory compliance, or guaranteed result. Preserve the existing published-evidence distinctions. Sources: `lib/site.ts`, `content/industries.ts`.

## Engagement and process

The published engagement options are Build Audit, Product Build, and Ongoing Engineering. Costs, timing, capacity, milestones, dependencies, support, and operating responsibilities are agreed for the scope. Inquiry timeline and budget choices express visitor preferences; they are not fixed prices or delivery commitments.

The process is to understand the problem, agree scope and costs, choose how working progress is reviewed, and plan documentation, access, and operational handover. Sources: `content/demo.ts` (`process`, `pricing`, `estimator`), `content/services.ts`.

## Client work and evidence

The case-study collection contains SoloSuit, PastPresent, ProLyrics.ai, Quick Sync, and Alula. These are client-owned products to which Engisols contributed. The current homepage shows the first four with real screenshots and contribution descriptions. `content/case-studies.ts` remains the authority for the published role and evidence; `app/(site)/page.tsx` selects the homepage work.

Keep metrics attached to their named client and original scope. SoloSuit's platform lifetime figures are not Engisols delivery outcomes. Products without published performance numbers must not receive invented substitutes. Do not turn client product facts into agency-wide claims, testimonials, guarantees, or comparative cost promises.

## Inquiry behavior and contact

The homepage inquiry collects project stage, requested timing, budget preference, and reply email. It opens a `mailto:` draft addressed to the configured contact address. The visitor must send it from their email app; the site does not confirm server delivery. Sources: `components/sections/ScopeEstimator.tsx`, `content/demo.ts`.

The configured site is `https://www.engisols.com` and the inquiry address is `growth@engisols.com`. `lib/site.ts` owns these values and the navigation destinations. The main-site floating WhatsApp link uses the original site's published Call / WhatsApp number, `+1 971 365 1608`, and opens a draft for the visitor to send.

## Durable constraints

- Preserve the original particle identity, supplied Engisols logo, and established theme colors. This work refines an inherited site; no replacement visual world or approved comp is recorded.
- Keep all five services equally visible, with actions and selected choices identifiable beyond color alone.
- Reduce repetitive decorative containers and unsupported proof claims; use actual client work and clear descriptions.
- Keep client ownership and Engisols' contribution explicit.
- Agree pricing, timing, capacity, and support per scope; do not invent availability, delivery windows, or guarantees.
- State the email-draft behavior honestly, including the visitor's final send step.
- Preserve the distinction between the main site and separately scoped campaign tools.

These constraints come from the homepage refinement brief and are reflected in `app/(site)/page.tsx`, `components/sections/Hero.tsx`, `components/layout/Header.tsx`, `components/motion/ParticleField.tsx`, and `app/globals.css`. `DESIGN.md` records the visual system; runtime ownership stays in the stylesheet.
