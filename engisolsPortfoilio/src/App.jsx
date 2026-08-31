import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SeoMeta from './components/SeoMeta'
import HomePage from './pages/HomePage'
import { usePageTracking } from './hooks/usePageTracking'

// Lazy-load the detail page so its bundle only loads when a user clicks into a case study.
// Keeps the main site bundle lean and the homepage TTI fast.
const CaseStudyDetailPage = lazy(() => import('./pages/CaseStudyDetailPage'))

// Has to sit inside <BrowserRouter> — useLocation() needs the router context.
function RouteTracker() {
  usePageTracking()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Suspense fallback={<div className="route-fallback" />}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SeoMeta />
                <HomePage />
              </>
            }
          />
          <Route
            path="/case-studies/:slug"
            element={<CaseStudyDetailPage />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
