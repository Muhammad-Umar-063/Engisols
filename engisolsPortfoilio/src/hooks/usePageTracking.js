import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Sends a GA4 page_view on every route change.
 *
 * The gtag snippet in index.html sets `send_page_view: false`, because in a
 * single-page app gtag's automatic page_view fires once on load and never
 * again — client-side navigation to /case-studies/:slug would never be
 * recorded. This hook owns every page_view instead, first load included.
 *
 * The send is deferred by one frame so react-helmet-async has committed the
 * new <title> before we read it; otherwise each page_view would be reported
 * under the *previous* page's title.
 */
export function usePageTracking() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (typeof window.gtag !== 'function') return
      window.gtag('event', 'page_view', {
        page_path: `${pathname}${search}`,
        page_location: window.location.href,
        page_title: document.title,
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, search])
}
