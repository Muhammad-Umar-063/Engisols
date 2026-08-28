import ContactForm from '../forms/ContactForm'

export default function ContactSection() {
  return (
    <section id="contact">
      <div className="contact-container">
        <div className="contact-info reveal" data-reveal>
          <div className="section-tag">Get In Touch</div>
          <h2 className="section-title">
            Let&apos;s Build Something
            <br />
            <span className="accent">Great Together</span>
          </h2>
          <p className="section-desc">
            Have a project in mind? Reach out and one of our engineers will respond within 24 hours.
          </p>

          <div>
            <div className="contact-detail">
              <div className="contact-icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="contact-detail-label">Email Us</div>
                <a className="contact-detail-value" href="mailto:growth@engisols.com">
                  growth@engisols.com
                </a>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <div className="contact-detail-label">Call / WhatsApp</div>
                <a className="contact-detail-value" href="tel:+19713651608">
                  +1 971 365 1608
                </a>
              </div>
            </div>

            <div className="contact-detail">
              <div className="contact-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#dd3e5e" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 110-4.124 2.062 2.062 0 010 4.124zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                </svg>
              </div>
              <div>
                <div className="contact-detail-label">Connect</div>
                <a
                  className="contact-detail-value"
                  href="https://www.linkedin.com/company/engisols/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-wrapper reveal" style={{ transitionDelay: '0.1s' }} data-reveal>
          <h3 className="form-card-title">Send Us a Message</h3>
          <ContactForm
            submitLabel="Send Message →"
            successLabel="Message Sent ✓"
          />
        </div>
      </div>
    </section>
  )
}
