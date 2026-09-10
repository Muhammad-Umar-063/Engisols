'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useSyncExternalStore } from 'react'

import {
  bridgeProductionCheckEvent,
  browserMetaConsent,
  metaPixel,
} from '@/src/meta/browser'
import { META_CONSENT_EVENT } from '@/src/meta/consent'
import type { MetaConsentDecision } from '@/src/meta/types'

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname()
  const consent = useSyncExternalStore(
    subscribeToConsent,
    browserMetaConsent,
    deniedServerSnapshot,
  )

  const initializePixel = useCallback(() => {
    if (consent !== 'granted' || !metaPixel.init(pixelId)) return
    metaPixel.pageView(pathname)
  }, [consent, pathname, pixelId])

  useEffect(() => {
    initializePixel()
  }, [initializePixel])

  useEffect(() => {
    function onProductionCheck(event: Event) {
      bridgeProductionCheckEvent((event as CustomEvent<unknown>).detail)
    }
    function onConsent(event: Event) {
      const decision = (event as CustomEvent<MetaConsentDecision>).detail
      if (decision !== 'granted' && decision !== 'denied') return
      metaPixel.setConsent(decision)
    }
    window.addEventListener('engisols:production-check', onProductionCheck)
    window.addEventListener(META_CONSENT_EVENT, onConsent)
    return () => {
      window.removeEventListener('engisols:production-check', onProductionCheck)
      window.removeEventListener(META_CONSENT_EVENT, onConsent)
    }
  }, [])

  if (consent !== 'granted' || !pixelId) return null
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
