import { useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { sendContactEmail } from '../../lib/emailjsClient'

const emptyValues = {
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
}

export default function ContactForm({
  submitLabel,
  successLabel,
  description,
  compact = false,
}) {
  const [values, setValues] = useState(emptyValues)
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  const isSubmitting = status === 'submitting'

  const buttonText = useMemo(() => {
    if (isSubmitting) {
      return 'Sending...'
    }

    if (status === 'success') {
      return successLabel
    }

    return submitLabel
  }, [isSubmitting, status, submitLabel, successLabel])

  const updateField = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setStatus('submitting')
    setFeedback('')

    try {
      await sendContactEmail(values)
      setStatus('success')
      setFeedback("Message sent! We will be in touch within 24 hours.")
      setValues(emptyValues)

      window.setTimeout(() => {
        setStatus('idle')
      }, 1500)
    } catch (error) {
      setStatus('error')
      setFeedback(error.message || 'Could not send message. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {description ? <p className="form-card-sub">{description}</p> : null}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            className="form-input"
            placeholder="Muhammad"
            value={values.firstName}
            onChange={updateField}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName" className="form-label">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            className="form-input"
            placeholder="Umar"
            value={values.lastName}
            onChange={updateField}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-input"
          placeholder="hello@company.com"
          value={values.email}
          onChange={updateField}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject" className="form-label">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          className="form-input"
          placeholder="Project Inquiry"
          value={values.subject}
          onChange={updateField}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="message" className="form-label">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          className={`form-textarea${compact ? ' compact' : ''}`}
          placeholder="Tell us about your project, goals, and timeline..."
          value={values.message}
          onChange={updateField}
          required
        />
      </div>

      <button
        type="submit"
        className="btn-primary magnetic-btn"
        disabled={isSubmitting}
      >
        {buttonText}
      </button>

      <p className="form-privacy">
        <ShieldCheck size={14} />
        <span>Your info is 100% private and never shared.</span>
      </p>

      {feedback ? (
        <p className={`form-feedback ${status === 'error' ? 'error' : 'success'}`}>
          {feedback}
        </p>
      ) : null}
    </form>
  )
}
