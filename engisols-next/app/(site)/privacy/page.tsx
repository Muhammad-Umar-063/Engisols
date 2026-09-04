import type { Metadata } from 'next'
import { LegalPage } from '@/components/sections/LegalPage'
import { legalPages } from '@/content/pages'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What we collect, what happens to client code, and what we do not do.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return <LegalPage page={legalPages.privacy} />
}
