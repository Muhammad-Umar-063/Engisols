import ShaderBackground from '../ui/ShaderBackground'

export default function Footer() {
  return (
    <footer className="footer-shader">

      {/* ── WebGL animated background ── */}
      <ShaderBackground />

      {/* ── Glass overlay so text stays legible ── */}
      <div className="footer-glass" />

      {/* ── Content (sits above canvas + glass) ── */}
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/engisols-logo-footer.svg" alt="ENGISOLS" width="120" height="32" />
            <p className="footer-desc">
              Your engineering vanguard. We build intelligent digital solutions that power growth, scale ideas, and solve real-world problems.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#team">Our Team</a></li>
              <li><a href="#reviews">Testimonials</a></li>
              <li><a href="#contact">Careers</a></li>
              <li><a href="#contact">Blog</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Services</div>
            <ul className="footer-links">
              <li><a href="#services">Web Development</a></li>
              <li><a href="#services">Mobile Apps</a></li>
              <li><a href="#services">UI/UX Design</a></li>
              <li><a href="#services">Cloud &amp; DevOps</a></li>
              <li><a href="#services">API Engineering</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Contact</div>
            <ul className="footer-links">
              <li><a href="mailto:hello@engisols.com">hello@engisols.com</a></li>
              <li><a href="tel:+923000000000">+92 300 000 0000</a></li>
              <li><a href="https://maps.google.com/?q=Lahore,Pakistan" target="_blank" rel="noopener noreferrer">Lahore, Pakistan</a></li>
              <li><a href="#contact">Book a Call</a></li>
              <li><a href="https://linkedin.com/company/engisols" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ENGISOLS. All rights reserved. Your Engineering Vanguard.</span>
          <div className="footer-bottom-links">
            <a href="#contact">Privacy Policy</a>
            <a href="#contact">Terms of Service</a>
            <a href="#contact">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
