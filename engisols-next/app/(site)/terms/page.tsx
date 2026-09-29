import { createPageMetadata } from '@/lib/seo'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { legalPages } from '@/content/pages'

export const metadata = createPageMetadata({
  title: 'Website terms',
  description: 'Terms for the Engisols website, AI App Audit, Production Check, Engineer Scope Review, and scoped offers.',
  path: '/terms',
})

export default function TermsPage() {
  return <LegalDocument page={legalPages.terms} />
}
