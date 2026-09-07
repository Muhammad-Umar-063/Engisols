import type { DetectedTechnology, ScanFinding } from './types'

export function detectFindingTechnologies(
  findings: readonly Pick<ScanFinding, 'ruleId'>[],
): DetectedTechnology[] {
  const names = new Set<string>()
  for (const finding of findings) {
    if (finding.ruleId.startsWith('supabase.')) names.add('Supabase')
    if (finding.ruleId.startsWith('stripe.')) names.add('Stripe')
    if (finding.ruleId.startsWith('openai.')) names.add('OpenAI')
  }
  return [...names]
    .sort()
    .map((name) => ({ name, confidence: 'confirmed' as const }))
}
