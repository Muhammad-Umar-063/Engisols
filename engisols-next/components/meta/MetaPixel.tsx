'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useSyncExternalStore } from 'react'

import {
  bridgeAiAppAuditEvent,
  bridgeProductionCheckEvent,
  browserMetaConsent,
  metaPixel,
} from '@/src/meta/browser'
import { META_CONSENT_EVENT } from '@/src/meta/consent'
import type { MetaConsentDecision } from '@/src/meta/types'
import { AI_APP_AUDIT_META_EVENT } from '@/src/campaign/analytics'
import { isProductionCheckOfferUrl } from '@/src/production-check/analytics-privacy'

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname()
  const suppressPageView = isProductionCheckOfferUrl(pathname)
  const consent = useSyncExternalStore(
    subscribeToConsent,
    browserMetaConsent,
    deniedServerSnapshot,
  )

  const initializePixel = useCallback(() => {
    if (suppressPageView) return
    if (consent !== 'granted' || !metaPixel.init(pixelId)) return
    metaPixel.pageView(pathname)
  }, [consent, pathname, pixelId, suppressPageView])

  useEffect(() => {
    initializePixel()
  }, [initializePixel])

  useEffect(() => {
    function onAiAppAudit(event: Event) {
      bridgeAiAppAuditEvent((event as CustomEvent<unknown>).detail)
    }
    function onProductionCheck(event: Event) {
      bridgeProductionCheckEvent((event as CustomEvent<unknown>).detail)
    }
    function onConsent(event: Event) {
      const decision = (event as CustomEvent<MetaConsentDecision>).detail
      if (decision !== 'granted' && decision !== 'denied') return
      metaPixel.setConsent(decision)
    }
    window.addEventListener(AI_APP_AUDIT_META_EVENT, onAiAppAudit)
    window.addEventListener('engisols:production-check', onProductionCheck)
    window.addEventListener(META_CONSENT_EVENT, onConsent)
    return () => {
      window.removeEventListener(AI_APP_AUDIT_META_EVENT, onAiAppAudit)
      window.removeEventListener('engisols:production-check', onProductionCheck)
      window.removeEventListener(META_CONSENT_EVENT, onConsent)
    }
  }, [])

  if (suppressPageView || consent !== 'granted' || !pixelId) return null
  return (
    <>
      <Script
        id="engisols-meta-bootstrap"
        strategy="afterInteractive"
        onReady={initializePixel}
      >
        {'void 0'}
      </Script>
      <Script
        id="engisols-meta-pixel"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
    </>
  )
}

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener(META_CONSENT_EVENT, onStoreChange)
  return () => window.removeEventListener(META_CONSENT_EVENT, onStoreChange)
}

function deniedServerSnapshot(): MetaConsentDecision {
  return 'denied'
}
