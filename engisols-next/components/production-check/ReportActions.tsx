'use client'

import { useEffect, useState } from 'react'

import { CodeReviewIntake } from '@/components/production-check/CodeReviewIntake'
import { useToast } from '@/components/motion/Toast'
import { trackProductionCheck } from '@/src/production-check/analytics'
import { productionReportPath } from '@/src/production-check/paths'
import type { ReviewRequestContext } from '@/src/production-check/review-intake'

export function ReportActions({
  reportId,
  fixes,
  prompt,
  urgentFindings,
  reviewContext,
  tone = 'dark',
}: {
  reportId: string
  fixes: string
  prompt?: string
  urgentFindings: number
  reviewContext: ReviewRequestContext
  tone?: 'light' | 'dark'
}) {
  const { push } = useToast()
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [copiedAction, setCopiedAction] = useState<'report' | 'fixes' | 'prompt' | null>(null)
  const hasUrgentFindings = urgentFindings > 0

  useEffect(() => {
    trackProductionCheck('report_viewed', { reportId })
  }, [reportId])

  async function copy(
    text: string,
    action: 'report' | 'fixes' | 'prompt',
    event: 'report_link_copied' | 'copy_prompt_clicked' | 'copy_fixes_clicked',
    message: string,
  ) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAction(action)
      trackProductionCheck(event, { reportId })
      push(message)
    } catch {
      setCopiedAction(null)
      push('Copy was blocked by the browser. Select the text manually.', 'error')
    }
  }

  function copyReportLink() {
    const reportUrl = new URL(productionReportPath(reportId), window.location.origin).toString()
    return copy(reportUrl, 'report', 'report_link_copied', 'Shareable report link copied.')
  }

  const light = tone === 'light'

  function openIntake() {
    trackProductionCheck('scope_review_cta_clicked', { scan_id: reportId })
    trackProductionCheck('review_intake_opened', { reportId, urgent: hasUrgentFindings })
    setIntakeOpen(true)
  }

  return (
    <div id="next-step" className={`scroll-mt-28 border-t ${light ? 'border-greige/60 pt-step-2' : 'border-vanilla/25 pt-step-3'}`}>
      <div className="flex flex-col gap-step-1 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          aria-haspopup="dialog"
          data-production-review-trigger
          onClick={openIntake}
          className={`inline-flex min-h-12 items-center justify-center rounded-full px-step-3 text-center font-mono text-[0.65rem] font-medium leading-snug no-underline transition-opacity hover:opacity-90 sm:px-step-4 sm:text-xs ${light ? 'bg-cherry text-vanilla' : 'bg-vanilla text-cherry'}`}
        >
          <span>REQUEST FREE ENGINEER SCOPE CHECK</span>
        </button>
        <button
          type="button"
          onClick={copyReportLink}
          className={`min-h-12 cursor-pointer whitespace-nowrap rounded-full border px-step-2 font-mono text-[0.68rem] transition-colors sm:px-step-3 sm:text-xs ${light ? 'border-bordeaux/35 text-bordeaux hover:border-bordeaux hover:bg-oat/50' : 'border-vanilla/45 text-vanilla hover:border-vanilla hover:bg-vanilla/10'}`}
        >
          {copiedAction === 'report' ? 'REPORT LINK COPIED' : 'COPY REPORT LINK'}
        </button>
      </div>
      <p className={`mt-step-1 font-mono text-[0.65rem] leading-relaxed ${light ? 'text-bordeaux/60' : 'text-vanilla/65'}`}>
        FREE · NO OBLIGATION · NO REPOSITORY ACCESS REQUIRED
      </p>

      <p className={`mt-step-2 max-w-[62ch] text-sm leading-relaxed ${light ? 'text-bordeaux/70' : 'text-vanilla/70'}`}>
        Automated checks can only see the public surface. The scanner gives a fast diagnosis; an engineer can verify whether uncertain database, authorization, API, deployment, or architecture items actually matter for your application.
      </p>

      <details className="group mt-step-1">
        <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-step-2 font-mono text-[0.68rem] underline underline-offset-4 ${light ? 'text-bordeaux decoration-bordeaux/35' : 'text-vanilla decoration-vanilla/35'}`}>
          COPY FOR YOUR TEAM OR AI BUILDER
          <span aria-hidden className="text-lg transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
        </summary>
        <div className="flex flex-wrap gap-x-step-3 gap-y-step-1 pb-step-1">
          <button type="button" onClick={() => copy(fixes, 'fixes', 'copy_fixes_clicked', 'Recommended actions copied.')} className={`min-h-11 cursor-pointer font-mono text-[0.68rem] underline underline-offset-4 ${light ? 'text-bordeaux decoration-bordeaux/40' : 'text-vanilla decoration-vanilla/40'}`}>
            {copiedAction === 'fixes' ? 'ACTIONS COPIED' : 'COPY ACTIONS'}
          </button>
          {prompt ? (
            <button type="button" onClick={() => copy(prompt, 'prompt', 'copy_prompt_clicked', 'Builder prompt copied.')} className={`min-h-11 cursor-pointer font-mono text-[0.68rem] underline underline-offset-4 ${light ? 'text-bordeaux decoration-bordeaux/40' : 'text-vanilla decoration-vanilla/40'}`}>
              {copiedAction === 'prompt' ? 'BUILDER PROMPT COPIED' : 'COPY BUILDER PROMPT'}
            </button>
          ) : null}
        </div>
      </details>
      <CodeReviewIntake
        key={reportId}
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        reviewContext={reviewContext}
      />
    </div>
  )
}
