const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY

const friendlyMessages = {
  400: 'Invalid request. Please check your details and try again.',
  401: 'Form access key is invalid. Please contact support.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Email service encountered an error. Please try again shortly.',
  502: 'Email service is temporarily unreachable. Please try again in a few minutes.',
  503: 'Email service is temporarily unavailable. Please try again in a few minutes.',
  504: 'Email service timed out. Please try again in a few minutes.',
}

async function send(fields) {
  if (!ACCESS_KEY) {
    throw new Error('Missing VITE_WEB3FORMS_ACCESS_KEY in your environment.')
  }

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: ACCESS_KEY, ...fields }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.success === false) {
    throw new Error(
      data.message ||
        friendlyMessages[res.status] ||
        'Failed to send message. Please try again.',
    )
  }

  return data
}

export async function sendContactEmail(payload) {
  const fullName = `${payload.firstName} ${payload.lastName}`.trim()

  return send({
    name: fullName,
    email: payload.email,
    subject: payload.subject,
    message: payload.message,
  })
}

export async function sendHeroEmail(payload) {
  const fullName = `${payload.firstName} ${payload.lastName}`.trim()

  return send({
    name: fullName,
    email: payload.email,
    subject: `Free Consultation — ${payload.projectType}`,
    message: `Phone/WhatsApp: ${payload.phone}\nService Requested: ${payload.projectType}`,
  })
}
