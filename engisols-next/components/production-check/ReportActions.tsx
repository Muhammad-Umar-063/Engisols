'use client'

import { useEffect } from 'react'

import { useToast } from '@/components/motion/Toast'
import { trackProductionCheck } from '@/src/production-check/analytics'

export function ReportActions({
  reportId,
  fixes,
  prompt,
}: {
  reportId: string
  fixes: string
  prompt?: string
}) {
  const { push } = useToast()

  useEffect(() => {
    trackProductionCheck('report_viewed', { reportId })
  }, [reportId])

  async function copy(text: string, event: 'report_link_copied' | 'copy_prompt_clicked' | 'copy_fixes_clicked', message: string) {
    try {
      await navigator.clipboard.writeText(text)
      trackProductionCheck(event, { reportId })
      push(message)
    } catch {
      push('Copy was blocked by the browser. Select the text manually.', 'error')
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-step-2">
        <button type="button" onClick={() => copy(window.location.href, 'report_link_copied', 'Report link copied.')} className="rounded-full border border-bordeaux/30 px-step-3 py-step-2 text-sm hover:border-bordeaux">
          Copy report link
        </button>
        <button type="button" onClick={() => copy(fixes, 'copy_fixes_clicked', 'Recommended fixes copied.')} className="rounded-full border border-bordeaux/30 px-step-3 py-step-2 text-sm hover:border-bordeaux">
          Copy recommended fixes
        </button>
      </div>
      {prompt ? (
        <button type="button" onClick={() => copy(prompt, 'copy_prompt_clicked', 'Builder prompt copied.')} className="mt-step-3 rounded-full bg-bordeaux px-step-3 py-step-2 text-sm text-vanilla hover:opacity-90">
          Copy prompt
        </button>
      ) : null}
      <div className="mt-step-5 grid gap-step-3 lg:grid-cols-3">
        <article className="border-t border-bordeaux/25 pt-step-3">
          <p className="font-mono text-xs text-current/60">OPTION 1</p>
          <h3 className="mt-step-1 text-2xl">Fix it yourself</h3>
          <p className="mt-step-2 text-sm text-current/75">Use the prioritized recommendations and copy-paste prompt above.</p>
          <button type="button" onClick={() => copy(fixes, 'copy_fixes_clicked', 'Recommended fixes copied.')} className="mt-step-3 underline decoration-current/35 underline-offset-4">Copy recommended fixes</button>
        </article>
        <article className="border-t-2 border-cherry pt-step-3">
          <p className="font-mono text-xs text-current/60">$499 FIXED SCOPE</p>
          <h3 className="mt-step-1 text-2xl">Have Engisols fix the launch blockers</h3>
          <p className="mt-step-2 text-sm text-current/75">We&apos;ll confirm the scope and fix the highest-priority production issues.</p>
          <a href={`/contact?intent=production-fix&scan=${encodeURIComponent(reportId)}`} onClick={() => trackProductionCheck('fix_cta_clicked', { reportId })} className="mt-step-3 inline-block rounded-full bg-cherry px-step-3 py-step-2 text-vanilla no-underline hover:opacity-90">Get Engisols to fix it</a>
        </article>
        <article className="border-t border-bordeaux/25 pt-step-3">
          <p className="font-mono text-xs text-current/60">ONGOING HELP</p>
          <h3 className="mt-step-1 text-2xl">Talk to a senior engineer</h3>
          <p className="mt-step-2 text-sm text-current/75">Already have users, revenue, or an upcoming launch? Talk through the production gaps.</p>
          <a href={`/contact?intent=engineering-help&scan=${encodeURIComponent(reportId)}`} onClick={() => trackProductionCheck('senior_cta_clicked', { reportId })} className="mt-step-3 inline-block underline decoration-current/35 underline-offset-4">Talk to a senior engineer</a>
        </article>
      </div>
    </>
  )
}
