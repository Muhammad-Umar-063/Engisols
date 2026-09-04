import { LpLegal } from '@/components/campaign/LpLegal'
import { legalPages } from '@/content/pages'

export const metadata = {
  title: 'Privacy — AI app audit',
  robots: { index: false, follow: false },
}

export default function CampaignPrivacyPage() {
  return <LpLegal page={legalPages.privacy} />
}
