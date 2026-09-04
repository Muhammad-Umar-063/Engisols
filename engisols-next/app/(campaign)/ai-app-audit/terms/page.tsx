import { LpLegal } from '@/components/campaign/LpLegal'
import { legalPages } from '@/content/pages'

export const metadata = {
  title: 'Terms — AI app audit',
  robots: { index: false, follow: false },
}

export default function CampaignTermsPage() {
  return <LpLegal page={legalPages.terms} />
}
