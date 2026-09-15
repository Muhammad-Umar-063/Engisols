export type MetaConsentDecision = 'granted' | 'denied'

export interface MetaIdentifiers {
  fbp?: string
  fbc?: string
}

export interface MetaEventDelivery {
  eventId: string
  attemptedAt?: string
  sentAt?: string
}

export interface ProductionCheckScanMetaTracking {
  consent: MetaConsentDecision
  identifiers: MetaIdentifiers
  eventSourceUrl: string
  scanStartedEventId: string
  scanCompleted: MetaEventDelivery
}

export interface MetaLeadTracking {
  consent: MetaConsentDecision
  identifiers: MetaIdentifiers
  eventSourceUrl: string
  lead: MetaEventDelivery
}

export interface ProductionCheckLeadMetaTracking extends MetaLeadTracking {
  qualifiedLead?: MetaEventDelivery
}

export type MetaBrowserStandardEvent = 'PageView' | 'Lead' | 'Schedule' | 'Purchase'
export type MetaBrowserCustomEvent = 'ScanStarted' | 'ScanCompleted' | 'QualifiedLead'
export type MetaServerEventName =
  | 'ScanCompleted'
  | 'Lead'
  | 'QualifiedLead'
  | 'Schedule'
  | 'Purchase'

export interface MetaCommerceData {
  currency: 'USD'
  value: 499 | 1999
}
