import type {
  ProductionCheckLead,
  ProductionCheckLeadNextStep,
  ProductionCheckLeadSegment,
} from './types'

type QualificationInput = Pick<
  ProductionCheckLead,
  'launchStage' | 'helpNeeded' | 'timeline' | 'appUrl'
> & {
  fixNow: number
  review: number
}

const launchStageWeights: Record<NonNullable<ProductionCheckLead['launchStage']>, number> = {
  experimenting: 0,
  preparing_to_launch: 2,
  has_users: 3,
  taking_payments: 4,
}

const helpWeights: Record<ProductionCheckLead['helpNeeded'], number> = {
  verify: 0,
  fix: 3,
  ongoing: 4,
}

const timelineWeights: Record<ProductionCheckLead['timeline'], number> = {
  exploring: 0,
  quarter: 1,
  month: 2,
  now: 3,
}

const hostedPlatformSuffixes = [
  'vercel.app',
  'netlify.app',
  'pages.dev',
  'web.app',
  'firebaseapp.com',
  'github.io',
  'onrender.com',
  'railway.app',
  'fly.dev',
  'lovable.app',
  'replit.app',
] as const

export function qualifyProductionCheckLead(
  input: QualificationInput,
): { score: number; segment: ProductionCheckLeadSegment } {
  const score =
    (input.launchStage ? launchStageWeights[input.launchStage] : 0) +
    helpWeights[input.helpNeeded] +
    timelineWeights[input.timeline] +
    (input.fixNow > 0 ? 2 : input.review > 0 ? 1 : 0) +
    (hasCustomProductionDomain(input.appUrl) ? 1 : 0)

  return { score, segment: segmentProductionCheckScore(score) }
}

export function segmentProductionCheckScore(score: number): ProductionCheckLeadSegment {
  if (score >= 9) return 'qualified'
  if (score >= 4) return 'maybe'
  return 'nurture'
}

export function nextStepForLeadSegment(
  segment: ProductionCheckLeadSegment,
): ProductionCheckLeadNextStep {
  if (segment === 'qualified' || segment === 'maybe') return 'engineer_scope_check'
  return 'report_guidance'
}

export function hasCustomProductionDomain(appUrl: string): boolean {
  try {
    const hostname = new URL(appUrl).hostname.toLowerCase().replace(/\.$/, '')
    if (
      !hostname ||
      hostname === 'localhost' ||
      hostname.includes(':') ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    ) {
      return false
    }
    return !hostedPlatformSuffixes.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
    )
  } catch {
    return false
  }
}
