import { createPageMetadata, SITE_DESCRIPTION } from '@/lib/seo'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowIcon } from '@/components/ui/ActionIcons'
import { Hero } from '@/components/sections/Hero'
import { ScopeEstimator } from '@/components/sections/ScopeEstimator'
import { caseStudies } from '@/content/case-studies'
import { pricing, process } from '@/content/demo'
import { SERVICES } from '@/lib/site'

export const metadata = createPageMetadata({
  title: 'Software Engineering & Development',
  description: SITE_DESCRIPTION,
  path: '/',
})

// Role descriptions drawn from the published client case studies.
const contributions: Record<string, string> = {
  'solosuit-legal-ai-platform': 'AI and software engineering for guided legal workflows, document generation, and attorney review.',
  'pastpresent-memory-platform': 'Retrieval, agent workflows, and moderation that turn contributed memories into print-ready books.',
  'prolyrics-ai-songwriting-saas': 'Rails product development, subscription access, CRM integrations, and automated content publishing.',
  'quick-sync-privacy-platform': 'Next.js interfaces, API routes, and data integration for encrypted sharing and live Q&A.',
}

export default function Home() {
  return (
    <div className="home-page">
      <Hero />
      <section id="services" className="home-services" aria-labelledby="services-title">
        <div className="shell home-section">
          <div className="home-section-heading">
            <h2 id="services-title">Engineering services</h2>
            <Link href="/services" className="site-text-link">Explore all services<ArrowIcon /></Link>
          </div>
          <ul className="site-services-list">
            {SERVICES.map((service) => (
              <li key={service.href}>
                <Link href={service.href} className="site-service-row">
                  <h3 className="site-service-name">{service.label}</h3>
                  <p className="site-service-description">{service.blurb}</p>
                  <ArrowIcon className="site-service-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section id="client-work" className="home-work" aria-labelledby="work-title">
        <div className="shell home-section">
          <div className="home-section-heading home-work-heading">
            <h2 id="work-title">Built for<br />our clients.</h2>
            <div>
              <p>Selected software, AI, and integration work. Each case study details our contribution.</p>
              <Link href="/work" className="site-text-link">View all client work<ArrowIcon /></Link>
            </div>
          </div>
          <ul className="home-projects">
            {caseStudies.slice(0, 4).map((study) => (
              <li key={study.slug}>
                <Link href={`/work/${study.slug}`} className="home-project">
                  <div className="home-project-image">
                    <Image src={study.imgSrc} alt={`${study.title} client website`} fill sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1399px) calc((100vw - 120px) / 2), 600px" />
                  </div>
                  <div className="home-project-caption">
                    <h3>{study.title}</h3>
                    <span className="home-project-category">Client work · {study.category}</span>
                  </div>
                  <p className="home-project-role">{contributions[study.slug]}</p>
                  <span className="site-text-link">Read case study<ArrowIcon /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="home-working" aria-labelledby="working-title">
        <div className="shell home-section home-working-layout">
          <div className="home-working-intro">
            <h2 id="working-title">From the first<br />conversation<br />to the handover.</h2>
            <p>Define the work together. Review working software as it develops. Leave the next team with the code, access, and documentation they need.</p>
            <Link href="/process" className="site-text-link">How we work<ArrowIcon /></Link>
          </div>
          <ol className="home-process">
            {process.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="home-engagements">
            <div>
              <h3>Start with the scope you need.</h3>
              <p>A review, a product build, or ongoing engineering. Each engagement is quoted against an agreed scope.</p>
              <Link href="/pricing" className="site-text-link">Engagement options<ArrowIcon /></Link>
            </div>
            <ul>{pricing.map((tier) => <li key={tier.name}>{tier.name}</li>)}</ul>
          </div>
        </div>
      </section>
      <section className="home-inquiry" aria-labelledby="inquiry-title">
        <div className="shell home-section home-inquiry-layout">
          <div>
            <h2 id="inquiry-title">What are<br />you building?</h2>
            <p>Tell us where you are and what needs to happen next.</p>
            <Link href="/contact" className="site-text-link">Contact Engisols<ArrowIcon /></Link>
          </div>
          <div className="home-inquiry-form">
            <ScopeEstimator />
            <p className="home-inquiry-note">Prepare an inquiry with your project stage, timeline, and budget. Send it from your email app.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
