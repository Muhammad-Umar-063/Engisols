import type { Metadata } from 'next'
import { LegalPage } from '@/components/sections/LegalPage'
import { legalPages } from '@/content/pages'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Terms covering this website. Engagements are governed by their signed contract.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return <LegalPage page={legalPages.terms} />
}
