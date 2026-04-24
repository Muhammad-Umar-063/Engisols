import { useEffect, useState } from 'react'
import SeoMeta from './components/SeoMeta'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/Navbar'
import AboutSection from './components/sections/AboutSection'
import ClientsStrip from './components/sections/ClientsStrip'
import ContactSection from './components/sections/ContactSection'
import HeroSection from './components/sections/HeroSection'
import ReviewsSection from './components/sections/ReviewsSection'
import ServicesSection from './components/sections/ServicesSection'
import TeamSection from './components/sections/TeamSection'
import { useScrollReveal } from './hooks/useScrollReveal'

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useScrollReveal()

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const ratio = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

      setProgress(Math.min(Math.max(ratio, 0), 100))
      setScrolled(scrollTop > 30)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleToggleMenu = () => {
    setMobileOpen((previous) => !previous)
  }

  const handleNavigate = () => {
    setMobileOpen(false)
  }

  return (
    <>
      <SeoMeta />
      <div id="scroll-progress" style={{ width: `${progress}%` }} />
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
        {/* <TeamSection /> */}
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
