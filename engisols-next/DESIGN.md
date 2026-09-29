---
name: Engisols
description: The inherited Engisols identity, with particle-led main-site pages and separately scoped campaign surfaces.
colors:
  cherry: "#cb1037"
  burgundy: "#5e0d20"
  blush: "#f1e2e4"
  vanilla: "#f2f2f0"
  oat: "#dededc"
  greige: "#9b9b9b"
  bordeaux: "#171717"
  valid: "#2f6b4f"
  scan-active: "#72dfa2"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(2.875rem, 7.5vw, 6rem)"
    fontWeight: 550
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 3rem)"
    fontWeight: 550
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 550
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 400
  utility:
    fontFamily: "Geist Mono, ui-monospace, monospace"
  campaign:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
rounded:
  action: "0.375rem"
  control: "0.5rem"
  card: "0.75rem"
  campaign-card: "1rem"
  campaign-action: "9999px"
spacing:
  step1: "0.5rem"
  step2: "1rem"
  step3: "1.5rem"
  step4: "2.5rem"
  step5: "4rem"
  step6: "6rem"
  step7: "10rem"
components:
  button-primary:
    backgroundColor: "{colors.cherry}"
    textColor: "{colors.vanilla}"
    rounded: "{rounded.action}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.burgundy}"
  button-secondary:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.vanilla}"
    rounded: "{rounded.action}"
    padding: "0.75rem 1.5rem"
  button-outline:
    backgroundColor: "{colors.vanilla}"
    textColor: "{colors.burgundy}"
    rounded: "{rounded.action}"
    padding: "0.75rem 1.5rem"
  field:
    backgroundColor: "{colors.vanilla}"
    textColor: "{colors.bordeaux}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
  choice:
    backgroundColor: "{colors.vanilla}"
    textColor: "{colors.bordeaux}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
  choice-selected:
    backgroundColor: "{colors.vanilla}"
    textColor: "{colors.burgundy}"
    borderColor: "{colors.burgundy}"
  site-card:
    backgroundColor: "{colors.vanilla}"
    textColor: "{colors.bordeaux}"
    rounded: "{rounded.card}"
  campaign-card:
    backgroundColor: "{colors.vanilla}"
    textColor: "{colors.bordeaux}"
    rounded: "{rounded.campaign-card}"
    padding: "1.5rem"
---

# Design System: Engisols

## Overview

**Creative North Star: "A senior engineering notebook made public"**

Engisols retains its original particle network, supplied logo, grotesque typography, and Crimson Red, Bright Gray, and Chicago Black identity. The main site uses open rows, large client screenshots, and changes of ground to make engineering work easy to inspect. Its tone is exact, candid, and calm. This is a refresh of an inherited system, not a record of approval for a new visual world or comp.

The homepage refinement removes repeated badge, statistic, capability, ticker, and boxed-summary sections. Campaign routes remain a separate family: `/ai-app-audit` and `/production-check` retain their scoped mastheads, editorial panels, typography, and scan-activity treatments.

Runtime ownership is **Model B**: `app/globals.css` owns the hand-maintained Tailwind tokens and scoped rules. This frontmatter records their values and component roles; it does not generate runtime CSS. `.impeccable/design.json` contains descriptive extensions only. `app/layout.tsx` loads the font assets and variables.

**Key Characteristics:**

- The particle network is the main site's identifying graphic.
- Open ruled rows expose services and process without decorative containers.
- Real client screenshots carry the work section, with attribution and contribution descriptions.
- Filled actions, underlined links, and marked choices show what can be done.
- Campaign styling stays within its route scope.

## Colors

### Primary

**Cherry / Crimson Red** marks primary actions, active row arrows, and keyboard focus on light grounds. It does not flood selected rows or options.

### Secondary

**Burgundy / dark crimson** carries secondary actions, text links, hover/current navigation text, selected control borders and markers, and main-site dark bands and footer. **Blush / soft crimson** remains an available content ground; it is not a hover or selected-state fill.

### Neutral

**Vanilla / Bright Gray** is the reading ground and open-menu surface. **Oat / supporting gray** carries the particle hero and process section. **Bordeaux / Chicago Black** is the body ink and particle color. **Greige / rule gray** separates content and borders controls; it is not body text on light grounds. Existing runtime names are retained even where they predate the supplied palette.

### Semantic exceptions

**Valid** is limited to confirmed success. **Scan active** is restricted to campaign motion indicating work in progress; it must not imply a passed check, security verdict, or general decoration.

**The Visible State Rule.** Pair color with an underline, border, checkmark, label, or current-page semantics so color is never the only action or state signal.

Keep state surfaces neutral. Service and menu rows retain their ground on hover, focus, and press; the title underline strengthens and the arrow takes the accent. The shared `--site-rule` mixes 22% bordeaux into vanilla for quiet decorative dividers. Control borders and focus outlines retain stronger contrast.

## Typography

The main site uses local **Bricolage Grotesque** for display and headings, **DM Sans** for body prose and controls, and **Geist Mono** for utility text where used. The local Bricolage asset is the inherited interim display face while the recorded identity guide's Aeronaut webfont is unavailable. No new font selection is made here.

The frontmatter display role describes the homepage hero, headline describes ordinary homepage section headings, and title describes process and engagement titles. The hero has a compact measure (`17ch`); supporting prose has a shorter reading measure (`45ch`) and relaxed leading (`1.55`). Work and inquiry invitations use a larger heading scale (`clamp(3rem, 6vw, 5.25rem)`); the process introduction uses `clamp(2.375rem, 4.1vw, 3.5rem)`. General long-form copy can use the existing measure (`68ch`). Headings use balanced wrapping and sentence case.

Campaign containers explicitly map display, body, and mono roles to Bricolage. The campaign overrides must not be mistaken for main-site body typography. No serif fallback is introduced.

**The Source Scope Rule.** Preserve the distinction between main-site font roles and campaign overrides; do not infer rendered typography from a utility name alone.

## Layout

Full-width section grounds contain the centered shell (`1280px` maximum), with horizontal insets of `24px`, rising to `40px` from `48rem`. Main-site standard bands use vertical space of `56px`, rising to `80px` at `64rem`; compact bands use spacing steps four and five. Campaigns retain their established larger band rhythm.

The current homepage sequence is particle hero → all five service rows → four client projects with role descriptions → ordered process and engagement summary → project inquiry. This is the homepage composition, not a template required on every route. Homepage sections use spacing step four on small screens and step five from `48rem`, with larger desktop space around work and inquiry. Work becomes a two-column grid at `48rem`; hero support/actions, process, engagement summary, and inquiry also become paired columns. Small screens retain one reading order.

All five services from `SERVICES` in `lib/site.ts` have equal hierarchy and direct links. Names sit beside descriptions from `48rem` and above them on smaller screens. Underlines and arrows expose the action; rules separate entries; nothing is preselected. Client screenshots use a wide frame (`1.72` aspect ratio) and contained images, preserving the supplied image rather than cropping it to fill.

Clip the particle decoration at the hero boundary. Keep page-level overflow visible so the existing sticky footer works. Do not apply the main-site density correction to campaign scopes.

## Elevation & Depth

The homepage is flat at rest. Ground changes, spacing, and rules establish hierarchy; client imagery has no decorative shadow or imitation material. A thin rule separates the desktop menu; pressed buttons and selected radio labels gain an inset state ring. These are local functional treatments, not a card-shadow language. Existing modal and toast elevation remains local to feedback.

Campaign code retains its gradient console, inset highlights, and scan trace. Those local treatments are not main-site primitives.

**The Open Content Rule.** On the homepage, separate editorial information with rules and spacing; reserve enclosing surfaces for controls and the expanded inquiry form.

## Shapes

Main-site actions use the small action radius (`6px`), fields and choice labels use the control radius, and existing cards, FAQ panels, and the expanded inquiry use the card radius. Desktop navigation is transparent and square with a thin state underline. Homepage screenshots remain unrounded; client category labels are plain text.

The campaign exception is explicit: campaign cards keep their larger radius, inner panels their existing smaller radius, and campaign actions their pill geometry. Native scrollbar thumbs also stay rounded; that does not make pills the main-site button rule.

## Components

### Buttons and links

Main-site buttons are at least `48px` high, using the action padding in frontmatter. Primary actions change cherry to burgundy on hover; secondary actions reverse that relationship. Outline actions retain their light ground and strengthen their text and border to bordeaux on hover. Pressed actions gain an inset ring; disabled actions use oat, a greige border, reduced opacity, and a disabled pointer.

Text links retain underlines and, where present, inline SVG arrows. Supporting links and navigation targets are at least `44px` high. Focus uses a visible outline (`2px`, offset `3px`), switching to vanilla on dark grounds. Keep the native pointer visible.

### Navigation

The header uses oat over the hero, then vanilla; open menus always use vanilla. Desktop links remain transparent, with burgundy text and a thin underline for hover, open, and current states. Text-link hover strengthens the underline and retains burgundy for contrast on both light grounds. The rejected large pink Work rectangle is not part of the system.

Services and Industries are disclosure buttons with chevrons. Click or Enter opens the menu, Arrow Down enters it, Tab follows links, and Escape closes it and returns focus. Menus expose an overview link and open descriptive rows without the duplicate contact/work aside. The header stays visible while a menu is open or reduced motion is enabled. Below `64rem`, Menu/Close exposes the mobile list, whose current-page row uses a burgundy underline and stronger weight with current-page semantics. The header CTA appears from `40rem`.

### Fields and choices

The main site has a fixed WhatsApp contact link at the lower right, outside the footer's transformed content. It uses a neutral surface, burgundy icon, 56px minimum target, and a quiet elevation shadow. Desktop includes the label; narrow screens keep the recognizable icon and accessible name. Safe-area insets keep it clear of device edges, and its layer stays below open navigation.

Fields have visible labels, a single border, the control radius, and a minimum height of `48px`. Selected radio choices retain the neutral ground and use a stronger burgundy border plus a filled circular checkmark; focus outlines the whole label. Tabs likewise use a checkmark and underline rather than a colored fill. The inquiry reveals project stage, requested timing, budget, and reply email. Its action opens an email draft and tells the visitor to send it from their email app. It does not claim delivery.

### Cards and client work

Existing site cards and FAQs use one border and the recorded radius. Hovered cards and open FAQs keep their neutral ground; borders and action text communicate state. The homepage instead presents open project links containing a real screenshot, client name, “Client work” category, contribution description, and underlined case-study action. The whole entry opens the case study. Attribution remains beside the imagery so showcasing a product does not imply agency ownership.

### Particle hero and motion

The original network is decorative and carries no copy. Its canvas uses 55% opacity so the graphic stays behind the text. Fine pointers receive an animated, pointer-reactive field; touch and reduced-motion environments receive a painted still network that redraws on resize. It stays inside the hero. The inherited scroll scene separates background and text; reduced motion removes scale, blur, parallax, and the extra scroll runway while retaining the background fade.

The headline retains its word-level CSS entrance. Service-row transitions and navigation underline/chevron movement stop under reduced motion. The inquiry keeps its expanding-panel interaction, transferring focus into the form and returning it on collapse.

### Campaign reports

Preserve existing campaign components and local typography. Progress leads with the current action and determinate state. Findings retain FIX NOW, REVIEW, and EXPECTED groups, with native disclosure for technical evidence. Persistent errors remain inline; copy actions use the global toast. Public observations and coverage must not imply a production-safety certification. Keep shareable payloads sanitized and the report accessible without an email gate.

## Do's and Don'ts

### Do:

- **Do** retain the supplied logo, palette, local display face, and original particle identity.
- **Do** expose all five services with equal hierarchy and visible direct actions.
- **Do** keep client screenshots, attribution, and concrete contributions together.
- **Do** preserve visible focus, disabled states, and non-color selection signals.
- **Do** keep campaign styling and feedback semantics within their existing scope.
- **Do** keep runtime design ownership in `app/globals.css`.

### Don't:

- **Don't** restore the large pink desktop navigation state or black expanded menu.
- **Don't** tint whole menu rows, cards, FAQs, or choice controls pink to indicate interaction.
- **Don't** rebuild the homepage from repeated badges, statistics, capability strips, or decorative boxed summaries.
- **Don't** obscure action labels with a custom cursor or make client categories resemble controls.
- **Don't** present client-owned products or their platform metrics as Engisols products or agency-wide results.
- **Don't** turn an email-draft action into a “message sent” confirmation.
- **Don't** use scan activity, thin public evidence, or an inverse risk number as proof of application safety or production readiness.
