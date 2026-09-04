# Engisols.com Build Specification

**Version:** 1.0
**Date:** 1 September 2026
**Status:** Decisions locked. Content blockers listed in section 3.

This is an implementation brief. Every decision here has been made. Do not re-litigate them, do not substitute alternatives, and do not invent any content marked as a blocker.

---

## 1. Brief

Rebuild engisols.com, the site for Engisols, a three-person senior engineering practice in Lahore selling AI-native software builds to founders and technical leaders in the US, UK, EU, Australia, New Zealand and Saudi Arabia.

**What the site must communicate:** three senior engineers, no juniors, no account managers, no handoffs. Work that ships. Senior rates justified by senior output.

**Primary conversion action:** book the paid diagnostic.
**Secondary:** submit the scope estimator.

**What the current site gets wrong, for context:** it renders client-side only and returns an empty shell, its positioning is interchangeable with any other agency, and it publishes no numbers, no prices and no named people. All three are fixed here.

---

## 2. Locked decisions

| Area | Decision |
|---|---|
| Framework | Next.js App Router, React, TypeScript |
| Rendering | Static generation. Server components by default. No client-rendered SPA. |
| Animation | Motion for React only. No GSAP, no Lenis, no smooth-scroll hijacking. |
| Styling | Tailwind, tokens defined in section 4 |
| Content | MDX or Sanity for case studies and blog |
| Palette | Warm five-value scheme, section 4 |
| Hero | Light. Alpine Oat ground, bordeaux particle network over it. Superseded the original dark hero. |
| Display type | Grotesque only. No serif anywhere. |
| Links | Always underlined. Colour alone is never the signal. |
| Motion budget | 8 scroll-linked scenes on the homepage, hard cap |
| Page transitions | Native CSS View Transitions, not a JS router |
| Vue | Not used. React only. |

---

## 3. BLOCKERS: content that must not be invented

**Do not generate placeholder values for anything in this list.** Leave the literal `{{TODO}}` marker in place and surface it in the build output. Fabricated client names, invented metrics, or made-up prices on an engineering agency site are worse than an empty section.

| Marker | What it needs | Blocks |
|---|---|---|
| `{{TODO: PRICING}}` | Real price for the paid diagnostic and the build range | Section 10, hero CTA, `/pricing` |
| `{{TODO: CASE_STUDIES}}` | 4 named projects with client, industry, one hard number each | Sections 4, 6, `/work` |
| `{{TODO: POSITIONING}}` | Lead with Build Rescue or general AI-native build | Hero headline, `/services` order |
| `{{TODO: TEAM}}` | Names, photos, one-line bios for the three engineers | Section 9, `/about` |
| `{{TODO: VERTICALS}}` | Which 6 industries have real shipped evidence | `/industries/*` |
| `{{TODO: CAPACITY}}` | Whether to publish a live availability line | Hero |
| `{{TODO: LOGOS}}` | Client logos cleared for public use | Section 2 |
| `{{TODO: PROOF_METRIC}}` | One defensible metric for the animated graph | Section 4 |

**Rule for section 4 specifically:** if no defensible metric exists, delete the line-graph animation entirely and render three static verified figures instead. Never animate a chart built on invented data.

---

## 4. Design system

### Colour tokens

```css
:root {
  --vanilla:  #F0E7DB;  /* primary light ground */
  --oat:      #DCCDBB;  /* secondary light ground */
  --greige:   #B3A091;  /* mid ground, rules, borders */
  --cherry:   #8E2430;  /* brand red: full-bleed panels, CTAs, links */
  --bordeaux: #43212A;  /* hero, footer, body type on light grounds */
}
```

Derived from a reference palette (Vanilla Silk, Alpine Oat, Warm Greige, Cherry Velvet, Bordeaux Noir). Cherry was brightened from the sampled `#471d1f` because at that value it was optically identical to Bordeaux.

Bordeaux was later lifted from `#2A1418` to `#43212A` — the same hue, HSL lightness 12% to 20% — for the same class of reason. At the sampled value the dark ground read as black with a warm cast, so the one place the palette is seen at full-bleed scale showed no colour at all. Every ratio in the table below was remeasured against the new value.

### Measured contrast

| Pair | Ratio | Use |
|---|---|---|
| bordeaux on vanilla | 11.52 | Body text, default |
| bordeaux on oat | 9.06 | Body text |
| bordeaux on greige | 5.61 | Body text |
| cherry on vanilla | 7.02 | Links, CTAs |
| cherry on oat | 5.52 | Links |
| cherry on greige | 3.42 | Large text only, never body |
| vanilla on bordeaux | 11.52 | Text on dark grounds |
| oat on bordeaux | 9.06 | Secondary text on dark |
| greige on bordeaux | 5.61 | Muted text on dark |
| vanilla on cherry | 7.02 | Text on cherry panels |
| vanilla vs oat | 1.27 | Not a contrast device |
| oat vs greige | 1.62 | Not a contrast device |
| greige on vanilla | 2.05 | Surface and borders only, never text |
| cherry vs bordeaux | 1.64 | Not separable at text size |

### Three hard colour rules

1. **This is a three-tier palette: light, mid, dark.** Vanilla and Oat are 1.27 apart. Treat Oat as a quiet variation for alternating sections. Nothing structural may depend on a reader perceiving that difference.
2. **Cherry has exactly two jobs:** full-bleed section panels and filled CTA buttons. It is never body text, never a small icon, never an inline highlight. It is indistinguishable from Bordeaux at text size and distinguishable only at full-bleed scale. Lifting Bordeaux closed the gap from 2.02 to 1.64, which tightens this rule rather than loosening it: a filled cherry CTA on a bordeaux ground is identified by its vanilla label at 7.02, not by its own edge.
3. **Links carry a permanent underline or bottom rule.** No red in this family clears AA on Vanilla while also separating from Bordeaux body text. This also satisfies WCAG 1.4.1.

### Typography

| Role | Family | Fallback | Rules |
|---|---|---|---|
| Display | Uncut Sans | General Sans | Weight 500 to 600. Tight tracking, roughly -0.02em. `clamp(2.75rem, 6vw, 7rem)`. |
| Body | Inter Tight | Switzer | Weight 400. Max 68 characters per line. |
| Mono | Geist Mono | JetBrains Mono | Real machine data only: latency, stack tags, deploy timestamps, capacity line. |

**No serif anywhere.** The palette is warm and soft. Serif on top of it reads as a beauty or interiors brand. Typography is the counterweight that makes this read as engineering.

**Banned typographic patterns**, all of which are generic tells:
- All-caps letterspaced eyebrow labels above headings
- One word in a headline coloured differently from the rest
- `01 / 02 / 03` numbered markers on anything that is not genuinely a sequence
- `→` appended to link and button text
- Meta strings joined with middle dots

### Layout

- Left-aligned. Single strong column with a wide right-hand gutter for metadata and status marks.
- Never centred hero copy over three equal cards. That is the template every competitor already uses, and on this palette it produces a skincare brand.
- Max content width 1280px, text column max 68ch.
- Spacing scale: 8 / 16 / 24 / 40 / 64 / 96 / 160.
- Section padding: 96px mobile, 160px desktop.
- Full-bleed section grounds, edge to edge, hard cuts between them. No gradient or soft transitions between sections.

### Status encoding

Red is the brand colour, so red cannot signal failure. Encode state structurally:
- Shipped or complete: **filled** cherry mark
- Stalled or incomplete: **outlined** mark on greige
- Always paired with a text label. Never colour alone.
- One exception: form validation success may use `#2F6B4F`, and nowhere else.

---

## 5. Rendering architecture

### The rule

Every marketing route must return complete HTML in the first response, with no JavaScript execution required to read the content.

### Implementation

- Server components by default. No `'use client'` on any `layout.tsx` or `page.tsx`.
- Push `'use client'` down to the leaf that actually needs a hook or an event handler.
- `generateStaticParams` on every dynamic route. Static generation at build time.
- ISR only on `/blog/*` and `/work/*`.
- All copy, headings and case study text render in server components.
- Client components receive rendered content as `children`. A motion wrapper animates a server-rendered node, it never generates the text itself.
- No client-side data fetching for anything indexable. The scope estimator is the only exception and does not need indexing.

### The SSR hydration gotcha

Motion's `initial={{ opacity: 0 }}` serialises into the SSR output as `style="opacity:0"`. The text is present in the HTML but invisible if JS fails. Gate the hidden state on mount:

```tsx
'use client'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

export function Reveal({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <motion.div
      initial={ready ? { opacity: 0, y: 16 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

Apply this pattern to all eight scroll scenes.

### Never do

- `'use client'` on a root layout
- `next/dynamic` with `ssr: false` on anything containing copy
- Fetching case studies or service copy in a `useEffect`
- Client-side routing that replaces server-rendered routes

---

## 6. Motion system

### Four rules

**1. One scene per viewport.** At any scroll position exactly one scroll-linked animation runs.

**2. One shared physics.** These three curves, nothing else:

```ts
export const EASE = {
  enter:  [0.22, 1, 0.36, 1],                          // entrances, 320-420ms
  micro:  [0.4, 0, 0.2, 1],                            // hover, focus, toggles, 120-180ms
  spring: { stiffness: 220, damping: 30, mass: 0.8 },  // pointer and drag only
} as const
```

**3. Small distances.** Translate maximums of 8, 16 or 24px. Never 60px slide-ups. Stagger 40ms per item, capped at 8 items.

**4. Reduced motion is a real branch.** Under `prefers-reduced-motion`, every scroll scene collapses to an opacity fade at final position, and all custom cursors switch off. Test this before shipping.

### Import discipline

```tsx
import { LazyMotion, domAnimation } from 'motion/react'
```

Never import the full bundle. Dynamically import every below-fold scene.

### Page transitions

```css
@view-transition { navigation: auto; }
```

Native cross-document transitions, no JS router. Chromium 126+ and Safari 18.2+ as of 2026. Firefox has not shipped cross-document yet, so this is progressive enhancement and unsupported browsers navigate normally. No fallback code needed.

---

## 7. Homepage specification

Twelve sections. The order is an argument: hook, agitate, prove, explain, price, remove risk, close.

Three dark bands only. If a fourth is proposed, one must come out.

| # | Section | Ground | Motion |
|---|---|---|---|
| 1 | Hero | `--bordeaux` | Scroll Zoom Hero + Split Text |
| 2 | Trust strip | `--bordeaux` | Ticker |
| 3 | The stall | `--vanilla` | Scroll Text Lines |
| 4 | Proof band | `--oat` | Line Graph + viewport-tracked counters |
| 5 | Services | `--vanilla` | Smooth Tabs |
| 6 | Selected work | `--greige` | Horizontal Scroll + Cursor Image Hover |
| 7 | Capability grid | `--cherry` | Pointer Collision Detection |
| 8 | How we work | `--vanilla` | Scroll Highlight |
| 9 | The three of you | `--oat` | Scroll Image Reveal |
| 10 | Pricing | `--vanilla` | Smooth Tabs (shared component) |
| 11 | Scope estimator | `--greige` | Create Button, Conditional Field, Dots Morph, Toast |
| 12 | Footer | `--bordeaux` | Footer Reveal |

Sections 1 and 2 share one continuous dark block, separated by a hairline `--greige` divider. The cut from section 2 into section 3 is the single biggest contrast moment on the page and must be hard, full-bleed, with no transition.

### Section detail

**1. Hero.** Oat ground, with the particle network inverted to bordeaux ink over it. (Originally specified dark; changed after build.) Display headline at the top of the type scale, Split Text word-level stagger, 40ms, runs exactly once. Background is a montage of real shipped product UIs, scroll-zoom scaling and fading. No stock 3D renders. Two CTAs: paid diagnostic primary (filled cherry), "See the work" secondary (underlined). Optional capacity line in mono: `{{TODO: CAPACITY}}`.

**2. Trust strip.** Continuous with the hero. Client logos, markets served, AWS Solutions Architect certification. `{{TODO: LOGOS}}`.

**3. The stall.** The pain, in the buyer's words. Line-by-line scroll reveal. Copy targets founders and technical leaders sitting on an unfinished build, a failed AI integration, or last changes that never shipped.

**4. Proof band.** Real numbers only. Viewport-tracked counters. Line graph only if `{{TODO: PROOF_METRIC}}` resolves, otherwise three static figures and the graph is deleted.

**5. Services.** Smooth Tabs across five services: AI and agentic systems, product and MVP build, build rescue, automation and integrations, cloud and DevOps. Each tab links to its service page.

**6. Selected work.** Horizontal gallery driven by vertical scroll. Cursor image hover on the list view. Each entry: client, industry, one hard number. `{{TODO: CASE_STUDIES}}`.

**7. Capability grid.** Full-bleed cherry. Pointer collision detection across a grid of stack tags: Python, FastAPI, Node, Rails, React, Next.js, Go, PostgreSQL, LangChain, LangGraph, pgvector, n8n, Ollama, AWS, GCP, Azure. This is the single show-off moment on the site. Everything around it stays quiet.

**8. How we work.** Sticky step nav with scroll highlight. Must cover: timezone overlap hours, who the client talks to (a named engineer, never a PM), IP assignment, NDA, code ownership and repo access from day one, and what happens if communication stalls. This section wins the offshore-risk objection and nobody in the competitive set writes it down.

**9. The three of you.** Scroll image reveal. Named engineers with photos. `{{TODO: TEAM}}`.

**10. Pricing.** Reuses the section 5 Smooth Tabs component. Offer ladder with real prices and a "who it's for" line under each tier. `{{TODO: PRICING}}`.

**11. Scope estimator.** Create Button expands into the form. Three questions maximum: build stage, timeline, budget band. Conditional fields expand only when relevant. Dots Morph on submit. Toast on success and error. No confetti.

**12. Footer.** Footer reveal. Four columns: Services, Work and Industries, Company, Legal. Vertical case study links live here for internal linking.

---

## 8. Animation map

Source: motion.dev examples. 34 URLs supplied, deduplicated to 26 unique effects. React variants only.

### Implement

| Example | Placement |
|---|---|
| `scroll-zoom-hero` | Section 1 |
| `split-text` | Section 1 headline only, once per page |
| `scroll-hide-header` | Global header |
| `mega-menu` | Header, Services and Industries columns |
| `scroll-text-lines` | Section 3 |
| `text-scroll-word-reveal` | Section 9 opener only |
| `scroll-track-element-in-viewport` | Drives section 4 counters |
| `line-graph` | Section 4, conditional on real data |
| `smooth-tabs` | Sections 5 and 10, one shared component |
| `scroll-horizontal` | Section 6 |
| `cursor-hover-follow` | Section 6 and `/work` index |
| `collision-hover-grid` | Section 7 |
| `scroll-highlight` | Section 8 |
| `scroll-image-reveal` | Section 9 |
| `create-button` | Section 11 |
| `clerk-conditional-field` | Section 11 |
| `dots-morph-button` | Section 11 submit |
| `base-toast` | Global, form success and error |
| `sheet-modal` | Mobile only: case study quick view, booking |
| `ios-pointer` | Global cursor, `(pointer: fine)` only |
| `footer-reveal` | Section 12 |
| `curtains-fade` | Route transitions, via CSS View Transitions |

### Do not implement

| Example | Reason |
|---|---|
| `curtains-blinds` | Tiring on repeat navigation. Optional single use on `/work` into a case study. |
| `cursor` (adaptive caret) | Third pointer system. Redundant with ios-pointer and cursor-hover-follow. |
| `scroll-velocity-linked-offset` | Decorative, GPU-expensive, competes with the horizontal gallery. Optional on `/work` only. |
| `confetti` | Wrong register for a B2B engineering buyer submitting a scope request. |
| All Vue variants | React equivalents exist. Do not mix frameworks. |

### How the agent sources this code

Install the Motion AI Kit before starting phase 2:

```bash
npx motion-ai
```

This wires Motion's hosted MCP servers and a `/motion` skill into Claude Code. No API key. If an older `motion` MCP entry exists that runs an `npx` command with a `TOKEN`, remove it. That flow is retired.

**Free tier:** current Motion docs as searchable MCP resources, animation best practices, CSS spring generation.

**Motion+ (recommended, one-time payment):** source code for all 430+ examples via MCP, plus MotionScore audits inside the editor. The MotionScore gate below requires this.

Do not let the agent write these effects from memory. Every one of the 22 examples in the table above should be pulled from the MCP by name, then adapted. Training-data recollections of Motion APIs go stale and produce subtly wrong `useScroll` offsets.

### Adaptation is mandatory, not optional

The MCP returns demo code. Demos are not production components. Every example must be adapted before it lands:

1. Replace all demo colours with the tokens from section 4.
2. Replace all inline easing and duration values with the `EASE` constants from section 6.
3. Apply the mount-gated SSR pattern from section 5. Demo code uses `initial={{ opacity: 0 }}`, which serialises invisible content into the HTML.
4. Add the `prefers-reduced-motion` branch. Demos do not have one.
5. Clamp translate distances to 8, 16 or 24px. Demos frequently use larger values.
6. Gate any pointer effect behind `(pointer: fine)`.
7. Wrap in `LazyMotion` with `domAnimation` and dynamically import if below the fold.

A scene that passes MotionScore but fails any of these seven is not done.

Check each implemented scene against Motion's MotionScore. Keep grade S or A. Reject anything below B.

---

## 9. Site architecture

```
Home (/)
├── Services (/services)
│   ├── /services/ai-engineering
│   ├── /services/product-build
│   ├── /services/build-rescue
│   ├── /services/automation
│   └── /services/cloud-devops
├── Work (/work)
│   └── /work/{slug}
├── Industries (/industries)
│   └── /industries/{slug}          ← 6 verticals, {{TODO: VERTICALS}}
├── Pricing (/pricing)
│   └── /pricing/build-audit        ← paid diagnostic
├── Process (/process)
├── Compare (/compare)
│   ├── /compare/in-house-hire
│   ├── /compare/offshore-dev-shop
│   ├── /compare/upwork-toptal
│   └── /compare/ai-coding-tools
├── About (/about)
├── Blog (/blog)
│   └── /blog/{slug}
├── Contact (/contact)
└── /privacy, /terms
```

### URL rules

Lowercase, hyphens not underscores, no dates in blog URLs, no IDs, consistent trailing slash policy. Breadcrumbs mirror the URL path exactly on `/services/*`, `/industries/*`, `/work/*`, `/blog/*`.

### Navigation

**Header:** Services (mega menu), Work, Industries (mega menu), Pricing, Process. CTA rightmost: "Book a Build Audit". Logo left, links home. Hides on scroll down, returns on scroll up.

**Mega menu:** 3 columns maximum. Services, Industries, one featured case study with thumbnail.

**Footer:** 4 columns. Services / Work and Industries / Company / Legal.

### Internal linking

- Every case study links to its service page and its industry page.
- Every industry page links to at least 2 case studies and 1 service.
- Every blog post links to one service page and one case study, with descriptive anchor text. Never "learn more" or "click here".
- Every compare page links to `/pricing/build-audit`.
- No orphan pages. A page with no inbound internal link does not ship.

---

## 10. Component inventory

| Component | Type | Notes |
|---|---|---|
| `Header` | client | Scroll direction hide, mega menu |
| `MegaMenu` | client | 3 columns max |
| `Hero` | server | Copy server-rendered |
| `ZoomHeroScene` | client | Wraps Hero children |
| `SplitText` | client | Once per page |
| `Ticker` | client | Logo strip |
| `ScrollTextLines` | client | Wraps server-rendered copy |
| `Counter` | client | Viewport-tracked |
| `LineGraph` | client | Conditional on real data |
| `SmoothTabs` | client | Shared by sections 5 and 10 |
| `HorizontalGallery` | client | Section 6 |
| `CursorImageHover` | client | `(pointer: fine)` only |
| `CollisionGrid` | client | Section 7 |
| `StickyStepNav` | client | Section 8 |
| `ImageReveal` | client | Section 9 |
| `ScopeEstimator` | client | Create button, conditional fields, dots morph |
| `Toast` | client | Global provider |
| `SheetModal` | client | Mobile only |
| `CustomCursor` | client | `(pointer: fine)`, off under reduced motion |
| `FooterReveal` | client | Section 12 |
| `Reveal` | client | Generic mount-gated wrapper, section 5 pattern |

---

## 11. File structure

```
app/
  layout.tsx                    server
  page.tsx                      server
  globals.css                   tokens, @view-transition
  services/page.tsx             server
  services/[slug]/page.tsx      server + generateStaticParams
  work/page.tsx                 server
  work/[slug]/page.tsx          server + generateStaticParams
  industries/[slug]/page.tsx    server + generateStaticParams
  pricing/page.tsx              server
  pricing/build-audit/page.tsx  server
  process/page.tsx              server
  compare/[slug]/page.tsx       server + generateStaticParams
  blog/[slug]/page.tsx          server + ISR
  about/page.tsx                server
  contact/page.tsx              server
  sitemap.ts
  robots.ts
components/
  sections/                     one per homepage section
  motion/                       all client motion wrappers
  ui/                           buttons, tabs, toast, modal
lib/
  motion.ts                     EASE constants
  content/                      MDX or Sanity queries
content/
  work/                         case studies
  blog/
```

---

## 12. Performance, SEO and CI gates

| Metric | Target |
|---|---|
| LCP | under 2.0s on 4G |
| INP | under 200ms |
| CLS | under 0.05 |
| Homepage JS | under 180KB gzipped |
| Lighthouse Performance | 90+ mobile |

### The crawlability gate

Run against every route in CI. If the headline is not in the raw response, the build fails:

```bash
curl -s https://engisols.com/ | grep -qi "<h1" || exit 1
```

Do not verify this with Lighthouse. Lighthouse executes JavaScript and will report success on a page that crawlers cannot read.

### Required at launch

- `sitemap.xml` and `robots.txt`
- Canonical tags on every page
- Organization and Service schema
- 301 redirects from every existing URL to its new equivalent
- Open Graph and Twitter card images per route

### Performance rules

- No animation library in the hero critical path. First paint is CSS only.
- Every below-fold scene dynamically imported.
- Animate `transform` and `opacity` only. Never `width`, `height`, `top`, `left`.
- All custom cursor work gated behind `(pointer: fine)`.

---

## 13. Accessibility

- Every interactive element has a visible keyboard focus state. Focus ring in cherry on light grounds, vanilla on dark.
- `prefers-reduced-motion` collapses all scroll scenes to opacity fades and disables custom cursors.
- All links underlined. Colour is never the sole signal for anything.
- Colour contrast per the table in section 4. `--greige` never carries text on `--vanilla`.
- Custom cursor never replaces native focus behaviour or keyboard navigation.
- Form errors announced, associated with their field, and never colour-only.
- Semantic heading order, one `h1` per page.

---

## 14. Definition of done

A section is complete when all of the following pass:

- [ ] Content renders in `curl` output with JS disabled
- [ ] Ground colour matches the section 7 table
- [ ] All text meets the contrast ratios in section 4
- [ ] Motion uses only the three curves from section 6
- [ ] Translate distances are 8, 16 or 24px
- [ ] Reduced motion branch tested and working
- [ ] Keyboard navigable with visible focus
- [ ] No `{{TODO}}` marker silently filled with invented content
- [ ] MotionScore grade S, A or B
- [ ] Mobile layout verified at 375px

---

## 15. Build order

| Phase | Scope |
|---|---|
| 0 | Resolve section 3 blockers. Nothing else starts until pricing and case studies exist. |
| 1 | Tokens, type scale, `EASE` constants, `Reveal` primitive, Header, Footer |
| 2 | Homepage, all 12 sections, all 8 motion scenes |
| 3 | Services (5), Work index, 4 case studies, Pricing, Build Audit, Process |
| 4 | Industries (6), Compare (4), About, Blog shell |
| 5 | Performance, accessibility, reduced-motion pass, schema, redirects, analytics |

Phase 0 cannot be compressed and must not be skipped by generating placeholder content.
