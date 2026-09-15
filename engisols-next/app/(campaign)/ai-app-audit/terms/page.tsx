import { permanentRedirect } from 'next/navigation'

export default function LegacyCampaignTermsPage() {
  permanentRedirect('/terms')
}
