import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { legalPages } from '@/content/pages'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Engisols handles website, AI App Audit, Production Check, review, analytics, and advertising data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <LegalDocument page={legalPages.privacy} />
}
