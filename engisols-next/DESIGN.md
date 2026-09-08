---
version: alpha
colors:
  primary: "#8e2430"
  vanilla: "#f0e7db"
  oat: "#dccdbb"
  greige: "#b3a091"
  cherry: "#8e2430"
  bordeaux: "#43212a"
  valid: "#2f6b4f"
  campaignCrimson: "#cb1037"
  campaignBrightGray: "#f2f2f0"
  campaignSupportGray: "#dededc"
  campaignRuleGray: "#9b9b9b"
  campaignChicagoBlack: "#171717"
  campaignDarkCrimson: "#5e0d20"
  campaignCrimsonGlow: "rgb(203 16 55 / 0.2)"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
  utility:
    fontFamily: "Geist Mono, ui-monospace, monospace"
rounded:
  small: "0.125rem"
  action: "9999px"
spacing:
  step1: "0.5rem"
  step2: "1rem"
  step3: "1.5rem"
  step4: "2.5rem"
  step5: "4rem"
  step6: "6rem"
  step7: "10rem"
components:
  campaignCard:
    backgroundColor: "#f0e7db"
    textColor: "#43212a"
    rounded: "1rem"
    padding: "1.5rem"
  primaryAction:
    backgroundColor: "#8e2430"
    textColor: "#f0e7db"
    rounded: "9999px"
    height: "3rem"
  findingCard:
    backgroundColor: "#f0e7db"
    textColor: "#43212a"
    rounded: "1rem"
    padding: "1.5rem"
---

# Engisols Design System

## Brand authority and migration

The formal Engisols identity guide supplied in September 2026 is the authority for future brand work: Crimson Red, Bright Gray, Chicago Black, a restrained dark-crimson/black gradient, Aeronaut primary, and Bricolage Grotesque secondary. Aeronaut webfont files are not currently available, so the supplied Bricolage variable asset is the approved interim face.

`/production-check` and `/ai-app-audit` are the first migrated campaign funnels. Their scoped `.production-check-brand` and `.engisols-campaign-brand` tokens in `app/globals.css` intentionally override the incumbent warm site palette and use Bricolage for every typographic role. Landing, progress, inline result, shared report, project disclosures, and inquiry modals must remain inside that one high-contrast system. Other routes retain the incumbent system until the separately approved site-wide migration; do not copy the override onto them piecemeal.

The approved interim web values for those funnels are Crimson `#cb1037`, Bright Gray `#f2f2f0`, Chicago Black `#171717`, supporting gray `#dededc`, rule gray `#9b9b9b`, and dark crimson `#5e0d20`. The production-check hero may use Crimson at 20% opacity as a light source over the 70/30 dark-crimson/black composition. These are scoped migration tokens, not additions to the incumbent site palette.

## Overview

Engisols should feel like a senior engineering notebook made public: warm, exact, candid, and calm. `/production-check` belongs to the same paid-campaign family as `/ai-app-audit`: a floating pill masthead, oversized grotesque headlines, rounded editorial panels, tool-logo strip, full-width ground changes, mono evidence labels, and restrained motion. It must never read like a neon cybersecurity dashboard.

This is a hybrid site. Marketing routes can be expressive; product routes prioritize task clarity, honest system state, and mobile readability. Avoid generic SaaS dashboards, fear-based red alerts, glossy gradients, glassmorphism, radar charts, and fake terminal logs.

## Colors

The runtime source of truth is `app/globals.css`; the values above map directly to its Tailwind theme tokens. Vanilla is the primary product ground, oat alternates sections, greige is a quiet rule or secondary ground, bordeaux is primary text and dark ground, and cherry is reserved for full panels and filled primary actions. Cherry is never the only carrier of status. `valid` is the only non-brand semantic color and is limited to confirmed success.

## Typography

Bricolage Grotesque carries display hierarchy, DM Sans carries prose and controls, and Geist Mono carries evidence labels, dates, phases, rule IDs, and compact counts. All faces remain grotesque or monospace; no serif fallback is introduced. Founder-facing explanations use normal sentence case and short measures.

## Layout

Pages use full-width campaign grounds and the 1280px `.shell`. The landing hero repeats the actual `/ai-app-audit` structure: message and proof on the left, the primary interactive object on the right. Product content is mobile-first at 375–430px, normally one column, then expands to restrained two-column compositions on desktop. The established 8/16/24/40/64/96 rhythm is canonical for campaign pages. Reports favor an editorial document flow over a dense dashboard.

## Elevation & Depth

Static surfaces stay flat. Use borders, ground changes, and spacing for hierarchy. Overlays may use the existing modal/toast elevation. Do not add decorative card shadows to report findings.

## Shapes

Site product cards use the site's small radius. Both `/ai-app-audit` and `/production-check` use the paid-campaign exception: 1rem cards, 0.75rem inner panels, and pill actions. Primary and compact action buttons use the existing pill form. Status labels are compact but must not look like interactive controls.

## Components

- Campaign primitives: reuse `HeroHeadline`, `Eyebrow`, `LpSection`, `Card`, `ToolStrip`, the `.shell`, and existing campaign motion classes before creating equivalents.
- Progress: a rounded campaign panel with the current action first, large determinate progress, stage sequence, one educational observation, then optional questions.
- Findings: rounded editorial report panels grouped FIX NOW, REVIEW, EXPECTED; classification and title dominate, founder explanation follows, native disclosure holds technical evidence.
- Forms: visible labels, owned validation, `noValidate`, clear errors, and duplicate-submit protection.
- Feedback: reuse the global toast for copy actions; persistent errors remain inline.
- Motion: short state transitions only and always safe under `prefers-reduced-motion`.

## Do's and Don'ts

- Do explain what was observed and what still needs code review.
- Do preserve EXPECTED as a visible category that teaches rather than alarms.
- Do show coverage beside exposure so thin evidence cannot imply production safety.
- Do keep shareable payloads sanitized at the persistence boundary.
- Don't describe an app as safe, secure, hacked, unsafe, or vulnerable.
- Don't use an inverse public-risk number as proof of production readiness.
- Don't reveal findings through dozens of live log lines; show only recent, sanitized observations.
- Don't gate the report behind email capture.
