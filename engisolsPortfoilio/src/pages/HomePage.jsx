import { useEffect, useRef, useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import AboutSection from '../components/sections/AboutSection'
import ClientsStrip from '../components/sections/ClientsStrip'
import ContactSection from '../components/sections/ContactSection'
import HeroSection from '../components/sections/HeroSection'
import ReviewsSection from '../components/sections/ReviewsSection'
import ServicesSection from '../components/sections/ServicesSection'
import CaseStudiesSection from '../components/sections/CaseStudiesSection'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const progressRef = useRef(null)
  const location = useLocation()

  useScrollReveal()

  // Scroll to hash target when arriving from another route (e.g. from a case study page)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      // Wait for layout/animations to settle before scrolling
      const t = window.setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
      return () => window.clearTimeout(t)
    } else {
      // Fresh load on "/" — start at the top
      window.scrollTo(0, 0)
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const ratio = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 100) / 100})`
        }
        setScrolled(scrollTop > 30)
        ticking = false
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleToggleMenu = useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  const handleNavigate = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return (
    <>
      <div id="scroll-progress" ref={progressRef} />

      <Navbar
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        onToggle={handleToggleMenu}
        onNavigate={handleNavigate}
      />

      <main>
        <HeroSection />
        <ClientsStrip />
        <AboutSection />
        <ServicesSection />
        <CaseStudiesSection />
        <ReviewsSection />
        <ContactSection />
      </main>

      <Footer />
      <div className="toast" id="toast">
        ✓ Message sent! We&apos;ll be in touch within 24 hours.
      </div>
    </>
  )
}
