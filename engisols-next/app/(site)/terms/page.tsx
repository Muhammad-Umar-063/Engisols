import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { legalPages } from '@/content/pages'

export const metadata: Metadata = {
  title: 'Website terms',
  description: 'Terms for the Engisols website, AI App Audit, Production Check, Engineer Scope Review, and scoped offers.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalDocument page={legalPages.terms} />
}
