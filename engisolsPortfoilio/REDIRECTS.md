# Domain & Canonical Redirects — host configuration required

The site code declares `https://www.engisols.com` as the canonical URL (in `SeoMeta.jsx` and `vite.config.js`).
For SEO to actually work, the **host / DNS** must enforce three rules:

1. **Force `www`** — redirect `engisols.com` → `https://www.engisols.com` (301 permanent).
2. **Force HTTPS** — redirect `http://*` → `https://*` (301 permanent).
3. **Consistent trailing slash** — pick one rule and stick to it. The current canonical URLs
   end with **no** trailing slash on inner pages (e.g. `/case-studies/ecommerce-platform`)
   and **a** trailing slash only on the root (`/`). Configure the host the same way.

Without these redirects Google sees up to 4 versions of every URL
(`http`, `https`, `www`, no-`www`) and treats them as duplicates, which kills rankings.

---

## Vercel — already covered by `vercel.json`

`vercel.json` already contains the SPA fallback. To add the canonical-host redirect, set the
project's **Production Domains**:

1. In Vercel → Project Settings → Domains:
   - Add `www.engisols.com` and mark it **Primary**.
   - Add `engisols.com` and Vercel will offer "Redirect to www.engisols.com" — accept it (308).
2. HTTP → HTTPS is automatic on Vercel; no config needed.

If you want explicit control, you can also add this to `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [{ "type": "host", "value": "engisols.com" }],
      "destination": "https://www.engisols.com/$1",
      "permanent": true
    }
  ]
}
```

---

## Netlify — `_redirects` and `netlify.toml`

The repo already has `public/_redirects` for the SPA fallback.
Add a host-level redirect to the **top** of that file (before the SPA rule):

```
# Force www + https
http://engisols.com/*    https://www.engisols.com/:splat   301!
https://engisols.com/*   https://www.engisols.com/:splat   301!
http://www.engisols.com/* https://www.engisols.com/:splat  301!

# SPA fallback (must stay last)
/*    /index.html   200
```

The `!` after `301` makes it a "force" redirect (it bypasses Netlify's "shadow" rule that would
otherwise serve an existing path).

If you prefer `netlify.toml`:

```toml
[[redirects]]
  from = "https://engisols.com/*"
  to = "https://www.engisols.com/:splat"
  status = 301
  force = true
```

---

## Cloudflare Pages / Cloudflare DNS

If the site is behind Cloudflare (DNS only or full proxy):

### Page Rules (legacy)

1. Cloudflare Dashboard → Rules → Page Rules → Create Page Rule
2. URL: `engisols.com/*`
3. Setting: "Forwarding URL" → 301 → `https://www.engisols.com/$1`

### Bulk Redirects (recommended, modern)

1. Cloudflare Dashboard → Rules → Redirect Rules → Create Rule
2. When incoming request matches: `Hostname equals engisols.com`
3. Then: 301 redirect, dynamic destination = `concat("https://www.engisols.com", http.request.uri.path)`
4. Preserve query string: yes

### HTTPS

In Cloudflare → SSL/TLS → Edge Certificates:
- Set "Always Use HTTPS" → ON
- Set "Automatic HTTPS Rewrites" → ON

---

## GoDaddy / Namecheap (DNS-only domain providers)

These don't natively do path-preserving 301 redirects — they only do "domain forwarding".
The fix is to point DNS at your hosting provider (Vercel/Netlify/Cloudflare) and let
that provider do the redirect, as documented above.

If you absolutely need to redirect at the registrar level, GoDaddy's "Forwarding" feature
will work but **does not preserve the path** (everyone lands on `/`). Avoid this for SEO.

---

## How to verify after deployment

Open a terminal and run:

```bash
# Should respond 301 with Location: https://www.engisols.com/
curl -I http://engisols.com

# Should respond 301 with Location: https://www.engisols.com/
curl -I https://engisols.com

# Should respond 200
curl -I https://www.engisols.com
```

If all three behave correctly, the canonical-host redirect is working.

---

## Why this matters

- Google treats `engisols.com` and `www.engisols.com` as **two different sites** unless
  redirected. Splitting backlinks across them halves your authority.
- Without HTTPS-forcing, browsers show "Not Secure" warnings and Google soft-deindexes
  HTTP versions.
- Search Console requires choosing **one** canonical property — and that choice must
  match what the host is doing. If they disagree, indexing breaks.
