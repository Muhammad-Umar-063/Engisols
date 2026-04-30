Open Graph (social-share) image — current state

Live file: og-image.jpg (1200×630, ~278 KB)

What's in it:
  • ENGISOLS branded card — "Deomi Dane / Co-Founder"
  • Cream textured background, large crimson "E" graphic on the right
  • ENGISOLS logo + "YOUR ENGINEERING VANGUARD" tagline at top-left

Where it's referenced:
  • src/components/SeoMeta.jsx → DEFAULT_OG_IMAGE
  • Used as <meta property="og:image"> on the homepage and any page that
    doesn't override `image` in its <SeoMeta>.
  • Case study detail pages override this with their own banner image.

To replace:
  1. Drop a new 1200×630 JPG (or PNG) at this path with the SAME filename
     (og-image.jpg). Keep it under ~1 MB for fast social previews.
  2. If your replacement is a different aspect ratio, crop/resize first:
       sips -Z 1200 your-image.png
       sips -c 630 1200 your-image.png
  3. If you want PNG instead of JPG, also update DEFAULT_OG_IMAGE in
     src/components/SeoMeta.jsx to point at the new extension.

Ideal contents (when designing a new one):
  • ENGISOLS brand mark
  • Slogan: "Your Engineering Vanguard"
  • Strong contrast, brand crimson (#dd3e5e) accent
  • Large, readable text — social previews are often shown at small sizes
