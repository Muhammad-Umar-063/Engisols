import { permanentRedirect } from 'next/navigation'

export default function LegacyCampaignPrivacyPage() {
  permanentRedirect('/privacy')
}
