# Main-site SEO review — 29 September 2026

The production build now has consistent search and social metadata across its 29 sitemap URLs. The review covered the main agency site, its linked pages, metadata, structured data, sitemap, robots rules, migration redirects, and mobile rendering. It did not measure live Google rankings, Search Console coverage, backlinks, or field Core Web Vitals.

## Findings and changes

| Priority | Finding and evidence | Impact | Resolution |
| --- | --- | --- | --- |
| High | `robots.ts` blocked `/ai-app-audit` and `/scan/next`, while their layouts/pages relied on `noindex`. | Crawlers could not read the exclusion tags. | Allow those pages to be crawled; retain their noindex metadata and sitemap exclusion. API routes remain disallowed. |
| Medium | `sitemap.ts` used `new Date()` for every page's `lastModified`. | Every build incorrectly claimed that every page had changed. | Omit dates until the content has authoritative modification dates. |
| Medium | The rendered homepage had no Open Graph tags or JSON-LD; source inspection found no main-site social metadata or schema. | Shared links lacked deliberate previews; search engines received no explicit organization/service relationships. | Add page-specific Open Graph and Twitter metadata, reuse the existing Engisols social image, add Organization and WebSite data, and add Service and BreadcrumbList data to relevant detail pages. |
| Medium | `/blog` had no published articles but remained indexable and in the sitemap. | Search could surface an empty publication index. | Set noindex, follow and exclude it from the sitemap until articles exist. |
| Medium | Broad titles such as “Work” and “Services” did not describe the page's subject; comparison titles repeated the agency name through the root template. | Search-result labels lacked context. | Use descriptive titles and one brand suffix; keep descriptions and canonical URLs aligned with each page. |
| Medium | A wildcard redirected every unknown legacy case-study slug to `/work`. | Missing content could behave like a soft 404. | Retain the five exact legacy redirects and collection redirect; unknown slugs return 404. |
| Medium | `/compare` and `/scan` had no inbound links from the sitemap pages. | Visitors and crawlers had limited paths to these entry points. | Add descriptive footer links to the comparison overview and free app check. |

The five services remain peer offerings. The review adds no pricing, rankings, testimonials, credentials, or client-performance claims. Client work stays attributed to its owners. The noindex policy for industries without published client evidence remains intact.

## Verification

- `npm ci`: zero reported dependency vulnerabilities at review time; no dependency changes.
- `npm run build`: passed, including TypeScript and all 45 application routes.
- `npm run lint`: zero errors; four existing `next/no-img-element` warnings in unchanged motion/demo files. Targeted lint for the changed site and SEO files passed without warnings.
- Production HTTP crawl: 29 unique sitemap URLs returned 200, with one H1 each, unique titles/descriptions, self-referencing canonicals, matching Open Graph URLs, Twitter cards, parseable JSON-LD, and no missing image alt attributes. Root canonical trailing-slash normalization was treated as equivalent.
- All 36 internal page destinations discovered in the sitemap pages returned 200. Every sitemap page has an inbound link from another sitemap page. The six distinct social-preview images returned successful image responses.
- Blog, scan handoff, paid campaign, production-check tool, and unevidenced industry exclusions retained noindex. None entered the sitemap.
- Known legacy study and collection URLs returned 308 redirects. The apex-host redirect returned the corresponding `www` URL. Unknown service, work, and legacy-study slugs returned 404.
- Browser inspection confirmed rendered Organization/WebSite JSON-LD, the homepage title, and no horizontal overflow at 319px and 1280px.
- The main-site WhatsApp link appears in every sitemap page, points to the original site's published Call / WhatsApp number, and opens a draft. Its 56px mobile target and desktop label were visually checked. No message was sent; account availability was not tested.

The isolated production preview used an ephemeral local attribution signing key so existing campaign pages could render. No production credentials or analytics events were required for the crawl. This does not validate campaign submission or email delivery.

## Checks after deployment

1. Submit or refresh `https://www.engisols.com/sitemap.xml` in Search Console and inspect representative service and case-study URLs. Confirm Google's selected canonicals and indexing status.
2. Run PageSpeed Insights against the deployed homepage and a service page, then evaluate field LCP, INP, and CLS when traffic data is available. A local build is not evidence of passing Core Web Vitals.
3. Validate the deployed structured data with Google's Rich Results Test or Schema.org Validator. Schema does not guarantee a rich result; no ratings or FAQ-rich-result claims are made here.
4. When the first useful articles are published, remove the blog's noindex rule and restore its sitemap entry together. Evaluate service-level search demand and content gaps using Search Console queries before expanding the content.

## References

- [Google: robots meta tags require crawl access](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google: robots.txt is not an indexing exclusion](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google: use accurate sitemap modification dates](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- Implementation was checked against the installed Next.js 16.3.4 metadata, JSON-LD, robots, and sitemap documentation.
