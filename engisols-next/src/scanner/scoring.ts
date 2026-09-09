import type {
  FindingCategory,
  ScanFinding,
  ScanScore,
} from './types'
import { FINDING_CATEGORIES } from './types'

export const CATEGORY_CAPS: Readonly<Record<FindingCategory, number>> = {
  security_headers: 20,
  credentials: 70,
  data_access: 18,
  admin_surface: 8,
  webhooks: 35,
  architecture: 8,
}

export function scoreFindings(findings: readonly ScanFinding[]): ScanScore {
  const totals = Object.fromEntries(
    FINDING_CATEGORIES.map((category) => [category, 0]),
  ) as Record<FindingCategory, number>

  for (const finding of findings) {
    if (finding.classification === 'by_design') {
      continue
    }
    totals[finding.category] += Math.max(0, finding.riskPoints)
  }

  const categoryDeductions = Object.fromEntries(
    FINDING_CATEGORIES.map((category) => [
      category,
      Math.min(totals[category], CATEGORY_CAPS[category]),
    ]),
  ) as Record<FindingCategory, number>
  const risk = Math.min(
    100,
    Object.values(categoryDeductions).reduce(
      (total, deduction) => total + deduction,
      0,
    ),
  )

  return {
    modelVersion: 'scanner-v1',
    scope: 'observed_public_surface',
    risk,
    readiness: 100 - risk,
    band:
      risk <= 10
        ? 'low'
        : risk <= 30
          ? 'moderate'
          : risk <= 60
            ? 'high'
            : 'critical',
    categoryDeductions,
  }
}
