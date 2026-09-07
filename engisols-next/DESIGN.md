---
version: alpha
colors:
  vanilla: "#f0e7db"
  oat: "#dccdbb"
  greige: "#b3a091"
  cherry: "#8e2430"
  bordeaux: "#43212a"
  valid: "#2f6b4f"
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
  band:
    maxWidth: "1280px"
    rule: "Full-bleed color ground with a centered content shell"
  button:
    radius: "9999px"
    rule: "Filled cherry on light grounds; filled vanilla on dark grounds"
  findingCard:
    radius: "0.125rem"
    rule: "Flat bordered surface; hierarchy comes from label, type, and spacing"
---

# Engisols Design System

## Overview

Engisols should feel like a senior engineering notebook made public: warm, exact, candid, and calm. The production-check routes are product surfaces inside the existing brand, not a neon cybersecurity dashboard. Their memorable signature is an evidence ledger—mono labels and hard horizontal rules—inside the site's editorial full-bleed bands.

This is a hybrid site. Marketing routes can be expressive; product routes prioritize task clarity, honest system state, and mobile readability. Avoid generic SaaS dashboards, fear-based red alerts, glossy gradients, glassmorphism, radar charts, and fake terminal logs.

## Colors

The runtime source of truth is `app/globals.css`; the values above map directly to its Tailwind theme tokens. Vanilla is the primary product ground, oat alternates sections, greige is a quiet rule or secondary ground, bordeaux is primary text and dark ground, and cherry is reserved for full panels and filled primary actions. Cherry is never the only carrier of status. `valid` is the only non-brand semantic color and is limited to confirmed success.

## Typography

Bricolage Grotesque carries display hierarchy, DM Sans carries prose and controls, and Geist Mono carries evidence labels, dates, phases, rule IDs, and compact counts. All faces remain grotesque or monospace; no serif fallback is introduced. Founder-facing explanations use normal sentence case and short measures.

## Layout

Pages use full-width `Band` grounds and the 1280px `.shell`. Product content is mobile-first at 375–430px, normally one column, then expands to restrained two-column compositions on desktop. The established 8/16/24/40/64/96/160 rhythm is canonical. Reports favor a readable document column over a dense dashboard.

## Elevation & Depth

Static surfaces stay flat. Use borders, ground changes, and spacing for hierarchy. Overlays may use the existing modal/toast elevation. Do not add decorative card shadows to report findings.

## Shapes

Site product cards use the site's small radius. The isolated paid-campaign surface uses 1rem cards as a documented campaign exception. Primary and compact action buttons use the existing pill form. Status labels are compact but must not look like interactive controls.

## Components

- Progress: determinate, text-readable without motion, and backed by real scanner events.
- Findings: grouped FIX NOW, REVIEW, EXPECTED; founder explanation first; native disclosure for technical evidence.
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
