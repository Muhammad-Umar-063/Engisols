import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SeoMeta from './components/SeoMeta'
import HomePage from './pages/HomePage'

// Lazy-load the detail page so its bundle only loads when a user clicks into a case study.
// Keeps the main site bundle lean and the homepage TTI fast.
const CaseStudyDetailPage = lazy(() => import('./pages/CaseStudyDetailPage'))

export default function App() {
  return (
    <BrowserRouter>
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
