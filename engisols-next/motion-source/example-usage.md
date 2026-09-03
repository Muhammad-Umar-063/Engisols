# Example usage — the demo page and CSS that shipped with the source drops

Kept as Markdown on purpose: the page below imports components that do not exist
in this repo, so as a `.tsx` it would fail the build. Nothing here is wired up.

Two things in it are worth reading even though the page itself is throwaway:

1. **The footer reveal API.** `FooterReveal` / `FooterRevealContent` /
   `FooterRevealFooter` from `@/components/motion/footer-reveal`. **That source
   file has not arrived** — only this usage of it. Our footer reveal is
   currently the CSS-only version in `app/globals.css` (`.page-content` +
   `.site-footer`), wired in `app/layout.tsx`.
2. **The overflow warning in the CSS.** It is the same trap `ZoomHeroScene`
   documents: `overflow: hidden | clip | auto | scroll` on any ancestor makes
   that element a scroll container, and every `position: sticky` descendant then
   pins to it instead of the viewport — silently, with no error. This repo has
   no overflow rule on `html` or `body`, and the hero's clip sits on the sticky
   pane itself rather than above it.

## page.tsx

```tsx
import { HorizontalScrollGallery, ScrollImageReveal, ScrollZoomHero } from "@/components/motion/scroll-stage"
import { HideOnScrollHeader, ScrollHighlightNav } from "@/components/motion/scroll-chrome"
import { ScrollTextLines, ScrollWordReveal } from "@/components/motion/scroll-text"
import { ScrollVelocityPlanes } from "@/components/motion/scroll-velocity-planes"
import {
  FooterReveal,
  FooterRevealContent,
  FooterRevealFooter,
} from "@/components/motion/footer-reveal"

/**
 * Server component. No "use client".
 *
 * Everything below renders to HTML on the server, so the crawler gets every
 * headline and link in the first response. Nothing is gated behind an effect.
 */

const work = [
  { id: "hoa", title: "Portfolio ops for 4,000 doors", meta: "Real estate", image: "/work/hoa.jpg" },
  { id: "intake", title: "Case intake that reads the file first", meta: "Legal", image: "/work/intake.jpg" },
  { id: "bids", title: "Bid takeoffs in a morning, not a week", meta: "Construction", image: "/work/bids.jpg" },
  { id: "payroll", title: "Payroll that reconciles itself", meta: "Payroll", image: "/work/payroll.jpg" },
]

const sections = [
  { id: "work", label: "Work" },
  { id: "approach", label: "Approach" },
  { id: "team", label: "Team" },
]

export default function Home() {
  return (
    <FooterReveal>
      <FooterRevealContent>
        <HideOnScrollHeader>
          <div className="flex items-center justify-between px-6 py-4">
            <a href="/">Engisols</a>
            <nav className="flex gap-6 text-sm">
              <a href="#work">Work</a>
              <a href="#approach">Approach</a>
              <a href="#contact">Start a project</a>
            </nav>
          </div>
        </HideOnScrollHeader>

        <main>
          <ScrollZoomHero
            image="/hero.jpg"
            eyebrow="Lahore, working across US, UK, EU and KSA"
            headline="We build the systems other agencies quote as impossible."
          >
            <p className="mt-6 max-w-[46ch] text-lg text-[--alpine-oat]">
              Three senior engineers. AI systems, automation and the unglamorous
              plumbing underneath them.
            </p>
          </ScrollZoomHero>

          <section id="approach" className="mx-auto max-w-3xl px-6 py-32">
            <ScrollTextLines className="text-4xl leading-[1.15] md:text-5xl">
              Most automation projects fail because nobody owns the boring middle: the data model, the retries, the thing that breaks at 3am on a Sunday.
            </ScrollTextLines>

            <ScrollWordReveal className="mt-16 gap-x-2 text-2xl leading-relaxed">
              We take that part. You get a system that survives contact with your actual customers, not a demo that works in the meeting.
            </ScrollWordReveal>
          </section>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 lg:grid-cols-[200px_1fr]">
            <ScrollHighlightNav sections={sections} />

            <div className="space-y-32">
              <section id="work" className="scroll-mt-32">
                <ScrollImageReveal
                  src="/work/dashboard.jpg"
                  alt="Operations dashboard built for a property management client"
                  caption="Four thousand units, one screen, no spreadsheets."
                />
              </section>

              <section id="team" className="scroll-mt-32">
                <ScrollImageReveal
                  src="/team.jpg"
                  alt="The Engisols team"
                  direction="left"
                  caption="Hamza, Ahmed, Israr."
                />
              </section>
            </div>
          </div>

          <HorizontalScrollGallery items={work} />

          <ScrollVelocityPlanes
            images={["/planes/1.jpg", "/planes/2.jpg", "/planes/3.jpg", "/planes/4.jpg"]}
          />
        </main>
      </FooterRevealContent>

      <FooterRevealFooter>
        <div className="flex min-h-[70vh] flex-col justify-between p-8 md:p-16">
          <div>
            <p className="max-w-[16ch] text-5xl leading-[0.95] md:text-7xl">
              Tell us what is breaking.
            </p>
            <a
              href="mailto:hello@engisols.com"
              className="mt-8 inline-block border-b border-[--cherry-velvet] pb-1 text-xl"
            >
              hello@engisols.com
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
            <div>
              <h2 className="mb-3 text-[--warm-greige]">Work</h2>
              <ul className="space-y-2">
                <li><a href="#work">Real estate</a></li>
                <li><a href="#work">Legal</a></li>
                <li><a href="#work">Construction</a></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-[--warm-greige]">Services</h2>
              <ul className="space-y-2">
                <li><a href="/ai-systems">AI systems</a></li>
                <li><a href="/automation">Automation</a></li>
                <li><a href="/cloud">Cloud</a></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-[--warm-greige]">Studio</h2>
              <ul className="space-y-2">
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div className="text-[--warm-greige]">
              <p>Lahore, Pakistan</p>
              <p className="mt-2">Engisols</p>
            </div>
          </div>
        </div>
      </FooterRevealFooter>
    </FooterReveal>
  )
}
```

## globals.css

```css
@import "tailwindcss";

:root {
  --vanilla-cream: #f3ede2;
  --alpine-oat: #e4dccb;
  --warm-greige: #a79c8e;
  --cherry-velvet: #8e2036;
  --bordeaux-noir: #2a1116;
}

@theme inline {
  --color-vanilla-cream: var(--vanilla-cream);
  --color-alpine-oat: var(--alpine-oat);
  --color-warm-greige: var(--warm-greige);
  --color-cherry-velvet: var(--cherry-velvet);
  --color-bordeaux-noir: var(--bordeaux-noir);
}

html {
  /* Never set scroll-behavior: smooth globally. It fights every useScroll
     spring in this system and makes anchor jumps feel rubbery. Scope it to
     specific anchor links instead if you want it. */
  background: var(--vanilla-cream);
  color: var(--bordeaux-noir);
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

/* No overflow rule here on purpose.
   `overflow: hidden`, `clip`, `auto` or `scroll` on any ancestor turns that
   element into a scroll container, and every `position: sticky` descendant then
   pins to it instead of the viewport. That breaks the footer reveal, the zoom
   hero and the horizontal gallery at once, with no error.
   Components that need clipping (the horizontal gallery) apply it to their own
   inner wrapper, which contains no sticky descendants. */

:focus-visible {
  outline: 2px solid var(--cherry-velvet);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  /* Scroll-linked transforms are scrubbed, not autoplayed, so they are less of
     a problem than autoplaying motion. The parallax and 3D banking still cause
     trouble for vestibular sensitivity, so those are flattened here. */
  [data-motion="parallax"],
  [data-motion="planes"] {
    transform: none !important;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Custom cursor -------------------------------------------------------- */

/* Applied by <Cursor /> only after it is tracking, and only on fine pointers.
   Scoped by selector rather than a blanket `* { cursor: none }` so the places
   where the native cursor carries real information keep it. */
.cursor-hidden,
.cursor-hidden * {
  cursor: none;
}

/* Text entry needs a caret, resize handles need to show the axis, and a
   disabled control needs to say so. These override the rule above. */
.cursor-hidden :is(input, textarea, [contenteditable="true"]) {
  cursor: text;
}

.cursor-hidden :is([disabled], [aria-disabled="true"]) {
  cursor: not-allowed;
}

.cursor-hidden [data-resize] {
  cursor: ew-resize;
}

/* Keyboard users get the native cursor back the moment focus moves by key,
   because a hidden pointer plus a focus ring is a confusing pair of signals. */
.cursor-hidden:has(:focus-visible) * {
  cursor: auto;
}

@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .cursor-hidden,
  .cursor-hidden * {
    cursor: auto;
  }
}
```
