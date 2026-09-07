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
      <div className="flex flex-wrap gap-step-1 sm:gap-step-2">
        <button type="button" onClick={() => copy(window.location.href, 'report_link_copied', 'Report link copied.')} className="min-h-11 cursor-pointer rounded-full border border-bordeaux/35 px-step-3 font-mono text-xs transition-colors hover:border-bordeaux hover:bg-oat/50">
          COPY REPORT LINK
        </button>
        <button type="button" onClick={() => copy(fixes, 'copy_fixes_clicked', 'Recommended fixes copied.')} className="min-h-11 cursor-pointer rounded-full border border-bordeaux/35 px-step-3 font-mono text-xs transition-colors hover:border-bordeaux hover:bg-oat/50">
          COPY RECOMMENDED FIXES
        </button>
        {prompt ? (
          <button type="button" onClick={() => copy(prompt, 'copy_prompt_clicked', 'Builder prompt copied.')} className="min-h-11 cursor-pointer rounded-full bg-bordeaux px-step-3 font-mono text-xs text-vanilla transition-opacity hover:opacity-90">
            COPY BUILDER PROMPT
          </button>
        ) : null}
      </div>
      <div className="mt-step-4 grid gap-step-2 lg:grid-cols-3">
        <article className="flex min-h-[20rem] flex-col rounded-2xl border border-greige/50 bg-oat p-step-3 sm:p-step-4">
          <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/65">01 · SELF-SERVE</p>
          <h3 className="mt-step-3 text-3xl">Fix it yourself</h3>
          <p className="mt-step-3 text-bordeaux/80">Use the prioritized recommendations and copy-paste prompt above.</p>
          <button type="button" onClick={() => copy(fixes, 'copy_fixes_clicked', 'Recommended fixes copied.')} className="mt-auto min-h-12 cursor-pointer self-start pt-step-4 font-mono text-xs underline decoration-bordeaux/40 underline-offset-4">COPY RECOMMENDED FIXES</button>
        </article>
        <article data-ground="dark" className="flex min-h-[20rem] flex-col rounded-2xl bg-cherry p-step-3 text-vanilla on-dark sm:p-step-4">
          <p className="font-mono text-xs tracking-[0.08em] text-vanilla/75">02 · $499 FIXED SCOPE</p>
          <h3 className="mt-step-3 text-3xl">Have Engisols fix the launch blockers</h3>
          <p className="mt-step-3 text-vanilla/90">We&apos;ll review the report, confirm the scope, and fix the highest-priority production issues.</p>
          <a href={`/contact?intent=production-fix&scan=${encodeURIComponent(reportId)}`} onClick={() => trackProductionCheck('fix_cta_clicked', { reportId })} className="mt-auto inline-flex min-h-12 items-center self-start rounded-full bg-vanilla px-step-3 font-mono text-xs font-medium text-cherry no-underline">GET ENGISOLS TO FIX IT <span aria-hidden className="ml-2">→</span></a>
        </article>
        <article className="flex min-h-[20rem] flex-col rounded-2xl border border-greige/50 bg-vanilla p-step-3 sm:p-step-4">
          <p className="font-mono text-xs tracking-[0.08em] text-bordeaux/65">03 · ONGOING HELP</p>
          <h3 className="mt-step-3 text-3xl">Need ongoing engineering help?</h3>
          <p className="mt-step-3 text-bordeaux/80">Already have customers, revenue, or an upcoming launch? Talk through the production gaps.</p>
          <a href={`/contact?intent=engineering-help&scan=${encodeURIComponent(reportId)}`} onClick={() => trackProductionCheck('senior_cta_clicked', { reportId })} className="mt-auto inline-flex min-h-12 items-center self-start pt-step-4 font-mono text-xs underline decoration-bordeaux/40 underline-offset-4">TALK TO A SENIOR ENGINEER <span aria-hidden className="ml-2">→</span></a>
        </article>
      </div>
    </>
  )
}
