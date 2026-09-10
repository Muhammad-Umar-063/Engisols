import { createHash } from 'node:crypto'

const prefixByEvent = {
  ScanStarted: 'scanstart',
  ScanCompleted: 'scancomplete',
  Lead: 'lead',
  QualifiedLead: 'ql',
  Schedule: 'schedule',
  Purchase: 'purchase',
} as const

export function createMetaEventId(
  eventName: keyof typeof prefixByEvent,
  durableId: string,
): string {
  const digest = createHash('sha256')
    .update(`engisols-meta-v1\0${eventName}\0${durableId}`)
    .digest('base64url')
    .slice(0, 32)
  return `${prefixByEvent[eventName]}_${digest}`
}
