import { Link, useLocation } from 'react-router-dom'
import ShaderBackground from '../ui/ShaderBackground'

// Smart link: stays as anchor on home (smooth scroll); becomes a router Link
// to "/<hash>" elsewhere so the user is taken back to the homepage and scrolled to the section.
function SmartHashLink({ href, children, className }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  if (isHome) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link to={`/${href}`} className={className}>
      {children}
    </Link>
  )
}

export default function Footer() {
  return (
    <footer className="footer-shader">
      <ShaderBackground />
      <div className="footer-glass" />

      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/engisols-logo-footer.svg" alt="ENGISOLS logo" width="120" height="32" loading="lazy" decoding="async" />
            <p className="footer-desc">
              Your engineering vanguard. We build intelligent digital solutions that power growth, scale ideas, and solve real-world problems.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><SmartHashLink href="#about">About Us</SmartHashLink></li>
              <li><SmartHashLink href="#case-studies">Case Studies</SmartHashLink></li>
              <li><SmartHashLink href="#reviews">Testimonials</SmartHashLink></li>
              <li><SmartHashLink href="#contact">Careers</SmartHashLink></li>
              <li><SmartHashLink href="#contact">Blog</SmartHashLink></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Services</div>
            <ul className="footer-links">
              <li><SmartHashLink href="#services">Web Development</SmartHashLink></li>
              <li><SmartHashLink href="#services">Mobile Apps</SmartHashLink></li>
              <li><SmartHashLink href="#services">UI/UX Design</SmartHashLink></li>
              <li><SmartHashLink href="#services">Cloud &amp; DevOps</SmartHashLink></li>
              <li><SmartHashLink href="#services">API Engineering</SmartHashLink></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Contact</div>
            <ul className="footer-links">
              <li><a href="mailto:hello@engisols.com">hello@engisols.com</a></li>
              <li><a href="tel:+923000000000">+92 300 000 0000</a></li>
              <li><a href="https://maps.google.com/?q=Lahore,Pakistan" target="_blank" rel="noopener noreferrer">Lahore, Pakistan</a></li>
              <li><SmartHashLink href="#contact">Book a Call</SmartHashLink></li>
              <li><a href="https://linkedin.com/company/engisols" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ENGISOLS. All rights reserved. Your Engineering Vanguard.</span>
          <div className="footer-bottom-links">
            <SmartHashLink href="#contact">Privacy Policy</SmartHashLink>
            <SmartHashLink href="#contact">Terms of Service</SmartHashLink>
            <SmartHashLink href="#contact">Cookie Policy</SmartHashLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
