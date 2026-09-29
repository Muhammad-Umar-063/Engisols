import { createPageMetadata } from '@/lib/seo'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { legalPages } from '@/content/pages'

export const metadata = createPageMetadata({
  title: 'Privacy policy',
  description: 'How Engisols handles website, AI App Audit, Production Check, review, analytics, and advertising data.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return <LegalDocument page={legalPages.privacy} />
}
