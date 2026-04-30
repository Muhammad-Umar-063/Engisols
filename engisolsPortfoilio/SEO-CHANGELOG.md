# SEO Changelog — ENGISOLS

This pass moved the site from a JS-rendered SPA with broken/missing meta to one that
emits clean per-page SEO signals, ships a valid sitemap and Open Graph image, and is
fully wired for canonical URLs. Domain enforcement still has to happen at the host —
see `REDIRECTS.md`.

---

## Files created

| File | Purpose |
|------|---------|
| `public/og-image.png` | 1200×630 placeholder Open Graph card. **Replace before launch** — see `public/README-og-image.txt`. |
| `public/README-og-image.txt` | Instructions for replacing the placeholder OG image. |
| `public/site.webmanifest` | PWA manifest (name, theme color, icons). |
| `REDIRECTS.md` | Host-side redirect instructions for Vercel / Netlify / Cloudflare / GoDaddy. |
| `SEO-CHANGELOG.md` | This file. |

(Already in place from prior work: `vercel.json`, `public/_redirects`, `public/_headers`,
`public/serve.json`.)

---

## Files modified

| File | Change |
|------|--------|
| `src/components/SeoMeta.jsx` | Removed trailing `/` on `SITE_URL`; added path normalization; switched JSON-LD to `Organization` schema with `address`, `sameAs`, `hasOfferCatalog`; added `<html lang="en">`, `og:locale`, `twitter:site`, `theme-color`, `author`, and a default `keywords` prop targeting long-tail terms. |
| `src/pages/CaseStudyDetailPage.jsx` | Title format → `"X Case Study \| ENGISOLS Engineering"`; per-study `keywords` derived from study title + category + tech stack; banner image given `role="img"` + `aria-label` and decorative overlays marked `aria-hidden`. |
| `vite.config.js` | Sitemap hostname → `https://www.engisols.com`; `generateRobotsTxt: false` so the custom `public/robots.txt` is preserved; added `changefreq: weekly`, `priority: 0.8`. |
| `public/robots.txt` | Added `Disallow: /admin` + `Disallow: /api`. |
| `src/components/sections/AboutSection.jsx` | Mobile-card title `<h3>` → `<p>` to fix the `h1 → h3` skip the SEO crawler reported. |
| `src/components/sections/ReviewsSection.jsx` | Avatar alt text now uses the reviewer's name + role context instead of bare initials. |
| `src/components/ui/expanding-cards.jsx` | Card images: descriptive alt (`{title} — ENGISOLS {category} case study`), `width`/`height` attributes set; CTA copy `"Read More"` → `"Read Case Study"`. |
| `src/components/layout/Navbar.jsx` | Logo alt: `"ENGISOLS"` → `"ENGISOLS logo"`. |
| `src/components/layout/Footer.jsx` | Logo alt: `"ENGISOLS"` → `"ENGISOLS logo"`. |
| `src/components/ui/RadialOrbitalTimeline.jsx` | Mark alt: `"ENGISOLS"` → `"ENGISOLS brand mark"`; added `loading="lazy"` + `decoding="async"`. |
| `src/index.css` | Removed render-blocking `@import` for Google Fonts (now loaded async via `<link rel="preload">` in `index.html`). |
| `index.html` | Async font preload pattern with `<noscript>` fallback; preconnect/dns-prefetch hints. |

---

## Dependencies added

**None.** Everything was achievable with what was already installed
(`react-helmet-async`, `vite-plugin-sitemap`).

The brief suggested `vite-react-ssg` / `react-snap` for prerendering and `@mdx-js/rollup`
for a blog. Both were skipped — see "Out of scope" below.

---

## Phases skipped (and why)

### Phase 4 — Prerendering with `vite-react-ssg`
Skipped. The project is currently a single-page anchor site (`/` with sections, plus
`/case-studies/:slug` detail pages). Migrating to `vite-react-ssg` would require:
- Restructuring `App.jsx` and `main.jsx` into the `ViteReactSSG` data-router shape.
- Rewriting routes as a static array.
- Verifying that all WebGL/canvas hooks (particle network, `framer-motion`, `tsparticles`)
  don't break under SSG's JSDOM-based prerender.

That's a multi-day refactor and was out of scope for "fix existing SEO without changing
functionality." **Recommended next step** if rankings stagnate after 3 months: spend a
sprint adding prerendering. The big wins would be the home page's title + meta description
appearing in raw HTML before JS executes.

In the meantime, modern Googlebot does render JS for indexable pages, so the per-page
`SeoMeta` will still work — just with a small crawl-budget penalty compared to prerendered HTML.

### Phase 10 — Service / blog page scaffolding
Skipped per project owner's instruction ("just go with demo data in case studies, I will
add up later"). The site has no `/services/web-development`, `/blog`, etc. routes today,
and the case study system already covers portfolio-style content.

If the project later wants those routes, the existing `SeoMeta` component is ready to
serve them — pass `path`, `title`, `description`, and `schema` per page.

---

## Manual actions required before launch

1. **Replace `public/og-image.png`** with a real 1200×630 brand card.
   Current file is a placeholder solid-color PNG. See `public/README-og-image.txt`.
2. **Configure host redirects** so `engisols.com` and `http://*` both 301 to
   `https://www.engisols.com`. Step-by-step instructions for Vercel / Netlify /
   Cloudflare / GoDaddy are in `REDIRECTS.md`.
3. **Replace the `TODO` placeholders in `SeoMeta.jsx`'s `baseSchema`:**
   - `foundingDate: 'TODO'` → actual founding year
   - `sameAs: ['TODO: ...']` → real LinkedIn / X / GitHub / Facebook URLs
   - `<meta name="twitter:site" content="@engisols" />` → real X handle
4. **Verify in Google Search Console:**
   - Submit `https://www.engisols.com/sitemap.xml`
   - Add the property as `https://www.engisols.com` (URL-prefix property, not Domain
     property — pick one and stick with it)
   - Use "URL Inspection" on a case study URL to confirm Google can render it
5. **Add analytics** (GA4, Plausible, Fathom). Currently no tracking is loaded — by
   design, since the brief said not to add anything without asking. Pick a provider and
   load it with `defer` or behind a consent banner.
6. **Add real social URLs** in the Footer / Contact section if/when accounts exist,
   then mirror them in the JSON-LD `sameAs` array.

---

## Expected SEO impact and timeline

| Window | Expected outcome |
|--------|------------------|
| Week 1–2 | Google starts crawling the new sitemap. Search Console shows `Discovered – currently not indexed` for case study URLs. |
| Month 1–2 | Case study URLs get indexed once host redirects + the og-image replacement are live. Branded queries (`"engisols"`, `"engisols agency"`) show the site #1. |
| Month 3–6 | Long-tail keywords (`"web development agency lahore"`, `"react developers pakistan"`) start appearing on page 2–3 if the content depth is enough. New domain "sandbox" effect lifts during this window. |
| Month 6–12 | Meaningful rankings on competitive long-tail terms — but only if actively producing new content (case studies, blog posts) and earning a few quality backlinks. SEO is compounding; results plateau without new signals. |

A new domain typically takes **3–6 months to lift out of the sandbox** and **6–12 months
to compete on commercial keywords**. There is no shortcut. This pass got the technical
foundations right; the next pass needs to be content + links.

---

## Verification checklist (post-deploy)

Run after the next production deploy with redirects configured:

- [ ] `curl -I http://engisols.com` → 301 → `https://www.engisols.com`
- [ ] `curl -I https://engisols.com` → 301 → `https://www.engisols.com`
- [ ] `curl -I https://www.engisols.com` → 200 with security headers
- [ ] `curl https://www.engisols.com/sitemap.xml` → lists 6 URLs (1 home + 5 case studies)
- [ ] `curl https://www.engisols.com/robots.txt` → references the sitemap
- [ ] `view-source:https://www.engisols.com/case-studies/ai-powered-crm` → `<title>` and
      `<meta name="description">` present (after JS hydrates — Googlebot will see this
      since it executes JS)
- [ ] OG card preview on https://www.opengraph.xyz/url/https%3A%2F%2Fwww.engisols.com → image renders
- [ ] Lighthouse SEO ≥ 95 on home and on a case study page
- [ ] Lighthouse Performance ≥ 80 on home

---

## Tech debt / future improvements

- **Prerendering** — see Phase 4 above. Highest-impact future improvement.
- **Sharp/Squoosh image pipeline** — case study images are loaded straight from Unsplash
  query strings. Self-hosting WebP + AVIF variants via `vite-imagetools` would cut LCP
  by 30–40% on slow connections.
- **Structured data per case study** — the `Article` schema already emits, but adding
  `CreativeWork` and explicit `mentions` for tech stack items would help Google understand
  the topical authority.
- **Real blog** — once the team has bandwidth for a content pipeline, MDX posts are the
  cheapest way to start ranking on informational queries.
- **Web Vitals monitoring** — wire `web-vitals` to GA4 / Plausible custom events to track
  LCP / INP / CLS regressions over time.
