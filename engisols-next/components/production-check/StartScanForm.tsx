'use client'

import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'

export function StartScanForm({
  attributionToken,
  onStarted,
}: {
  attributionToken: string
  onStarted: (scanId: string) => Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const submitGuard = useRef(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || submitGuard.current) return
    const value = url.trim()
    if (!value) {
      setError('Enter the public URL you want us to check.')
      inputRef.current?.focus()
      return
    }
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`
    setError('')
    submitGuard.current = true
    setSubmitting(true)
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, attributionToken }),
      })
      const body = (await response.json()) as {
        ok: boolean
        scanId?: string
        metaEvents?: { scanStarted?: string }
        error?: { message?: string }
      }
      if (!response.ok || !body.ok || !body.scanId) {
        throw new Error(body.error?.message || 'The scan could not be started.')
      }
      trackProductionCheck('scan_started', {
        ...(body.metaEvents?.scanStarted
          ? { metaEventId: body.metaEvents.scanStarted }
          : {}),
      })
      await onStarted(body.scanId)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The scan could not be started. Please try again.',
      )
      submitGuard.current = false
      setSubmitting(false)
    }
  }

  return (
    <form
      className="rounded-2xl border border-greige/50 bg-vanilla p-step-3 text-bordeaux shadow-[0_24px_70px_-48px_rgba(42,20,24,0.75)] sm:p-step-4"
      onSubmit={submit}
      noValidate
    >
      <div className="flex items-center justify-between gap-step-2 border-b border-greige/50 pb-step-2">
        <p className="font-display text-lg">Free production check</p>
        <span className="whitespace-nowrap rounded-full bg-oat px-step-2 py-1 font-mono text-[0.65rem] tracking-[0.08em]">ABOUT 12 SEC</span>
      </div>
      <label htmlFor="production-check-url" className="mt-step-4 block font-mono text-xs tracking-[0.08em] text-bordeaux/75">
        LIVE APP URL
      </label>
      <div className="mt-step-2 space-y-step-2">
        <div className="relative min-w-0">
          <input
            ref={inputRef}
            id="production-check-url"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'production-check-url-error' : 'production-check-url-help'}
            placeholder="https://yourapp.com"
            className="h-16 w-full rounded-xl border-2 border-bordeaux/55 bg-oat/20 px-step-3 pr-14 text-lg outline-none placeholder:text-bordeaux/45 focus:border-cherry"
          />
          {url ? (
            <button
              type="button"
              aria-label="Clear website URL"
              onClick={() => {
                setUrl('')
                setError('')
                inputRef.current?.focus()
              }}
              className="absolute inset-y-0 right-0 grid min-h-11 w-14 place-items-center text-xl text-bordeaux/60 hover:text-bordeaux"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="flex h-16 w-full items-center justify-center rounded-full bg-cherry px-step-4 font-mono text-sm font-medium tracking-tight text-vanilla transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {submitting ? 'STARTING CHECK…' : <>CHECK MY APP <span aria-hidden className="ml-2">→</span></>}
        </button>
      </div>
      <p className="mt-step-2 text-center text-xs leading-relaxed text-bordeaux/65">
        By starting a check, you confirm you own or operate this app, or have permission to assess it, and agree to the{' '}
        <Link href="/terms" className="underline decoration-bordeaux/35 underline-offset-4 hover:decoration-bordeaux">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline decoration-bordeaux/35 underline-offset-4 hover:decoration-bordeaux">
          Privacy Policy
        </Link>
        .
      </p>
      {error ? (
        <p id="production-check-url-error" role="alert" className="mt-step-2 border-l-2 border-bordeaux pl-step-2 text-sm">
          {error}
        </p>
      ) : (
        <p id="production-check-url-help" className="mt-step-3 text-center font-mono text-[0.65rem] leading-relaxed tracking-[0.06em] text-bordeaux/70">
          FREE · PUBLIC PAGES ONLY · NO LOGIN OR CODE ACCESS
        </p>
      )}
    </form>
  )
}
