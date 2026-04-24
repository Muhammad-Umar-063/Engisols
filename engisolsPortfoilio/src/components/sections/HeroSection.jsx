import { useMemo, useState } from 'react'
import { sendHeroEmail } from '../../lib/emailjsClient'

const emptyValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  projectType: '',
}

export default function HeroSection() {
  const [values, setValues] = useState(emptyValues)
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  const isSubmitting = status === 'submitting'

  const buttonText = useMemo(() => {
    if (isSubmitting) return 'Sending...'
    if (status === 'success') return 'Request Sent ✓'
    return 'Book Your Free Call →'
  }, [isSubmitting, status])

  const updateField = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setFeedback('')

    try {
      await sendHeroEmail(values)
      setStatus('success')
      setFeedback("We'll be in touch within 24 hours.")
      setValues(emptyValues)

      const toast = document.getElementById('toast')
      if (toast) {
        toast.classList.add('show')
        window.setTimeout(() => toast.classList.remove('show'), 4000)
      }

      window.setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      setFeedback(err?.message || 'Could not send. Please try again.')
    }
  }

  return (
    <section id="home">
      <div className="hero-bg" />
      <div className="hero-grid-lines" />
      <canvas id="hero-particles" />
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />

      <div className="hero-content">
        <div className="hero-badge hero-animate" style={{ '--d': '0.1s' }}>
          Available for New Projects
        </div>

        <h1 className="hero-title hero-animate" style={{ '--d': '0.25s' }}>
          We Don&apos;t Just
          <br />
          <span className="accent">Build Software.</span>
          <br />
          We Engineer
          <br />What&apos;s Next.
        </h1>

        <p className="hero-desc hero-animate" style={{ '--d': '0.45s' }}>
          ENGISOLS is a modern software development company built for a world that never slows down.
          We design and engineer intelligent digital solutions that power growth and scale ideas.
        </p>

        <div className="hero-stats hero-animate" style={{ '--d': '0.6s' }}>
          <div>
            <div className="hero-stat-num">
              <span className="count-up" data-target="120" data-suffix="+">120+</span>
            </div>
            <div className="hero-stat-label">Projects Delivered</div>
          </div>
          <div>
            <div className="hero-stat-num">
              <span className="count-up" data-target="98" data-suffix="%">98%</span>
            </div>
            <div className="hero-stat-label">Client Retention</div>
          </div>
          <div>
            <div className="hero-stat-num">
              <span className="count-up" data-target="5" data-suffix="yr+">5yr+</span>
            </div>
            <div className="hero-stat-label">Industry Experience</div>
          </div>
        </div>
      </div>

      <div className="hero-form-card hero-animate" style={{ '--d': '0.15s' }}>
        <div className="form-card-tag">Free Consultation</div>
        <h2 className="form-card-title">
          Schedule a Call
          <br />
          With Our Team
        </h2>
        <p className="form-card-sub">
          Tell us about your project — we&apos;ll get back within 24 hours.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Muhammad"
                value={values.firstName}
                onChange={updateField}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Umar"
                value={values.lastName}
                onChange={updateField}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contact / WhatsApp</label>
            <input
              type="tel"
              name="phone"
              placeholder="+92 300 0000000"
              value={values.phone}
              onChange={updateField}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="hello@company.com"
              value={values.email}
              onChange={updateField}
              required
            />
          </div>

          <div className="form-group">
            <label>Project Type</label>
            <select
              name="projectType"
              value={values.projectType}
              onChange={updateField}
              required
            >
              <option value="" disabled>Select a service...</option>
              <option>Web Application Development</option>
              <option>Mobile App Development</option>
              <option>UI/UX Design</option>
              <option>API &amp; Backend Engineering</option>
              <option>Cloud &amp; DevOps</option>
              <option>Custom Software</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary magnetic-btn"
            disabled={isSubmitting}
          >
            {buttonText}
          </button>

          <div className="form-privacy">
            <svg
              width="12"
              height="12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Your info is 100% private &amp; never shared.
          </div>

          {feedback ? (
            <p className={`form-feedback ${status === 'error' ? 'error' : 'success'}`}>
              {feedback}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
