import ContactForm from '../forms/ContactForm'

export default function ContactSection() {
  return (
    <section id="contact">
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
              <div className="contact-detail-value">hello@engisols.com</div>
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
              <div className="contact-detail-value">+92 300 0000000</div>
            </div>
          </div>

          <div className="contact-detail">
            <div className="contact-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="contact-detail-label">Visit Office</div>
              <div className="contact-detail-value">Lahore, Punjab, Pakistan</div>
            </div>
          </div>

          <div className="contact-detail">
            <div className="contact-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="contact-detail-label">Working Hours</div>
              <div className="contact-detail-value">Mon – Sat, 9:00 AM to 7:00 PM</div>
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
    </section>
  )
}
