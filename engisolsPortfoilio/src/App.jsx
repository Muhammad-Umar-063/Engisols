import { useEffect, useRef, useCallback, useState } from 'react'
import SeoMeta from './components/SeoMeta'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import AboutSection from './components/sections/AboutSection'
import ClientsStrip from './components/sections/ClientsStrip'
import ContactSection from './components/sections/ContactSection'
import HeroSection from './components/sections/HeroSection'
import ReviewsSection from './components/sections/ReviewsSection'
import ServicesSection from './components/sections/ServicesSection'
import { useScrollReveal } from './hooks/useScrollReveal'

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const progressRef = useRef(null)

  useScrollReveal()

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
    setMobileOpen(prev => !prev)
  }, [])

  const handleNavigate = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return (
    <>
      <SeoMeta />
      <div id="scroll-progress" ref={progressRef} />
      <div id="cursor-spotlight" />

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
        <ReviewsSection />
        <ContactSection />
      </main>

      <Footer />
      <div className="toast" id="toast">
        ✓ Message sent! We'll be in touch within 24 hours.
      </div>
    </>
  )
}

export default App
