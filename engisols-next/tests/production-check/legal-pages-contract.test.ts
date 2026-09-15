import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

const legalContent = read('content/pages.ts')
const termsRoute = read('app/(site)/terms/page.tsx')
const privacyRoute = read('app/(site)/privacy/page.tsx')
const legacyTermsRoute = read('app/(campaign)/ai-app-audit/terms/page.tsx')
const legacyPrivacyRoute = read('app/(campaign)/ai-app-audit/privacy/page.tsx')
const campaignContent = read('content/campaign.ts')
const productionFooter = read('components/production-check/ProductionCheckFooter.tsx')
const productionLanding = read('app/production-check/page.tsx')
const productionReport = read('components/production-check/ReportView.tsx')
const productionOffer = read('app/production-check/offer/[offerId]/page.tsx')
const startScanForm = read('components/production-check/StartScanForm.tsx')

test('global legal routes are canonical, indexable documents in the site visual system', () => {
  for (const [source, canonical] of [[termsRoute, '/terms'], [privacyRoute, '/privacy']] as const) {
    assert.match(source, /import \{ LegalDocument \} from '@\/components\/legal\/LegalDocument'/)
    assert.match(source, new RegExp(`alternates: \\{ canonical: '${canonical}' \\}`))
    assert.doesNotMatch(source, /robots:\s*\{\s*index:\s*false/)
  }
})

test('terms cover every public tool and the commercial boundary without inventing checkout', () => {
  const requiredHeadings = [
    'Using the Engisols website',
    'AI App Audit',
    'Production Check',
    'Authorization to scan',
    'Engineer Scope Review',
    'Scoped offers and paid work',
    'Acceptable use',
    'Intellectual property',
    'Third-party services and links',
    'Disclaimers and warranties',
    'Limits on liability',
    'Changes to these terms',
    'Contact',
  ]
  for (const heading of requiredHeadings) assert.match(legalContent, new RegExp(`heading: '${heading}'`))
  assert.match(legalContent, /scope approval is not payment/i)
  assert.match(legalContent, /private authentication, authorization, Row Level Security, or server-side behavior/i)
  assert.match(legalContent, /not a penetration test/i)
})

test('privacy copy names actual data, providers, controls, and verified retention periods', () => {
  const requiredHeadings = [
    'Information you provide',
    'Production Check data',
    'Engineer Scope Review and offers',
    'Analytics, session replay, and advertising measurement',
    'Attribution and technical data',
    'How we use information',
    'Service providers',
    'Retention',
    'Security',
    'Your data rights',
    'International processing',
    'Children',
    'Changes to this policy',
    'Contact',
  ]
  for (const heading of requiredHeadings) assert.match(legalContent, new RegExp(`heading: '${heading}'`))
  for (const provider of ['Vercel', 'Upstash', 'Resend', 'PostHog', 'Meta']) {
    assert.match(legalContent, new RegExp(provider))
  }
  assert.match(legalContent, /90 days/)
  assert.match(legalContent, /365 days/)
  assert.match(legalContent, /input values are masked/i)
  assert.match(legalContent, /raw HTML or JavaScript bundles/i)

  const providerSection = legalContent.match(/heading: 'Service providers'[\s\S]*?(?=heading: 'Retention')/)?.[0] ?? ''
  assert.doesNotMatch(providerSection, /Stripe|PayPal|Paddle|checkout provider/i)
})

test('the legal update date remains visible without internal review placeholders', () => {
  assert.equal((legalContent.match(/updated: '15 September 2026'/g) ?? []).length, 2)
  assert.doesNotMatch(legalContent, /TODO: LEGAL|attorney review|operational draft|not legal advice/i)
})

test('legacy campaign legal routes permanently redirect to the global documents', () => {
  assert.match(legacyTermsRoute, /permanentRedirect\('\/terms'\)/)
  assert.match(legacyPrivacyRoute, /permanentRedirect\('\/privacy'\)/)
  assert.doesNotMatch(legacyTermsRoute, /LpLegal|legalPages/)
  assert.doesNotMatch(legacyPrivacyRoute, /LpLegal|legalPages/)
})

test('campaign and every Production Check surface expose global legal links', () => {
  assert.match(campaignContent, /\{ label: 'Privacy', href: '\/privacy' \}/)
  assert.match(campaignContent, /\{ label: 'Terms', href: '\/terms' \}/)
  assert.match(productionFooter, /href="\/privacy"/)
  assert.match(productionFooter, /href="\/terms"/)
  for (const source of [productionLanding, productionReport, productionOffer]) {
    assert.match(source, /<ProductionCheckFooter \/>/)
  }
})

test('starting a scan gives a linked authorization notice without a mandatory checkbox', () => {
  assert.match(startScanForm, /own or operate/i)
  assert.match(startScanForm, /permission to (?:assess|check|scan)/i)
  assert.match(startScanForm, /href="\/terms"/)
  assert.match(startScanForm, /href="\/privacy"/)
  assert.doesNotMatch(startScanForm, /type="checkbox"/)
})
