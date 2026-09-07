'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'

import { trackProductionCheck } from '@/src/production-check/analytics'
import { productionScanPath } from '@/src/production-check/paths'

export function StartScanForm() {
  const router = useRouter()
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
        body: JSON.stringify({ url: normalized }),
      })
      const body = (await response.json()) as {
        ok: boolean
        scanId?: string
        error?: { message?: string }
      }
      if (!response.ok || !body.ok || !body.scanId) {
        throw new Error(body.error?.message || 'The scan could not be started.')
      }
      trackProductionCheck('scan_started')
      router.push(productionScanPath(body.scanId))
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
    <form className="max-w-3xl" onSubmit={submit} noValidate>
      <label htmlFor="production-check-url" className="font-mono text-xs text-current/70">
        Public website URL
      </label>
      <div className="mt-step-1 flex flex-col gap-step-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
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
            placeholder="yourapp.com"
            className="h-14 w-full rounded-sm border border-bordeaux/35 bg-transparent px-step-2 pr-12 text-base outline-none placeholder:text-bordeaux/40 focus:border-bordeaux"
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
              className="absolute inset-y-0 right-0 w-12 text-xl text-bordeaux/55 hover:text-bordeaux"
            >
              ×
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-14 shrink-0 rounded-full bg-cherry px-step-4 font-medium text-vanilla transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {submitting ? 'Starting check…' : 'Check production readiness'}
        </button>
      </div>
      {error ? (
        <p id="production-check-url-error" role="alert" className="mt-step-2 border-l-2 border-bordeaux pl-step-2 text-sm">
          {error}
        </p>
      ) : (
        <p id="production-check-url-help" className="mt-step-2 text-sm text-current/65">
          Passive public-surface scan. No account, repository, or GitHub access required.
        </p>
      )}
    </form>
  )
}
