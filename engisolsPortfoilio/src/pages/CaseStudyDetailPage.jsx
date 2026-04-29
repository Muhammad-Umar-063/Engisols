import { useEffect, useRef, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Monitor,
  Smartphone,
  BarChart3,
  Brain,
  Zap,
} from 'lucide-react'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import SeoMeta from '../components/SeoMeta'
import { getCaseStudyBySlug } from '../data/caseStudies'
import { useScrollReveal } from '../hooks/useScrollReveal'

const iconMap = {
  Monitor,
  Smartphone,
  BarChart3,
  Brain,
  Zap,
}

export default function CaseStudyDetailPage() {
  const { slug } = useParams()
  const study = getCaseStudyBySlug(slug)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const progressRef = useRef(null)
  const bannerImgRef = useRef(null)

  useScrollReveal()

  // Always start detail pages at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  // Scroll progress bar + parallax on the banner image
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight
        const ratio = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${
            Math.min(Math.max(ratio, 0), 100) / 100
          })`
        }
        // Subtle parallax on banner background image
        if (bannerImgRef.current && scrollTop < 1000) {
          bannerImgRef.current.style.transform = `scale(1.12) translateY(${
            scrollTop * 0.25
          }px)`
        }
        setScrolled(scrollTop > 30)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!study) return <Navigate to="/" replace />

  const HeroIcon = iconMap[study.iconName] ?? Monitor

  const seoSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${study.title} — ENGISOLS Case Study`,
        description: study.tagline,
        image: study.imgSrc,
        author: { '@type': 'Organization', name: 'ENGISOLS' },
        publisher: {
          '@type': 'Organization',
          name: 'ENGISOLS',
          logo: {
            '@type': 'ImageObject',
            url: 'https://engisols.com/engisols-mark.svg',
          },
        },
        mainEntityOfPage: `https://engisols.com/case-studies/${study.slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://engisols.com/' },
          { '@type': 'ListItem', position: 2, name: 'Case Studies', item: 'https://engisols.com/#case-studies' },
          { '@type': 'ListItem', position: 3, name: study.title, item: `https://engisols.com/case-studies/${study.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <SeoMeta
        title={`${study.title} — ENGISOLS Case Study`}
        description={study.tagline}
        path={`/case-studies/${study.slug}`}
        image={study.imgSrc}
        type="article"
        schema={seoSchema}
        keywords={`${study.title}, ${study.category}, ${study.techStack.join(', ')}, ENGISOLS case study`}
      />

      <div id="scroll-progress" ref={progressRef} />

      <Navbar
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        onToggle={() => setMobileOpen((p) => !p)}
        onNavigate={() => setMobileOpen(false)}
      />

      <main className="cs-detail-main">
        {/* ── Banner — frosted glass over blurred case study image ── */}
        <section className="cs-banner" aria-label={`${study.title} banner`}>
          <div
            className="cs-banner-img"
            ref={bannerImgRef}
            style={{ backgroundImage: `url(${study.imgSrc})` }}
          />
          <div className="cs-banner-glass" />
          <div className="cs-banner-vignette" />

          <Link to="/#case-studies" className="cs-back-link">
            <ArrowLeft size={14} strokeWidth={2.4} />
            Back to Case Studies
          </Link>

          <div className="cs-banner-content">
            <div className="cs-kicker">Case Study</div>

            <h1 className="cs-banner-title">
              {study.title}
              <br />
              <span className="accent">Built for Scale.</span>
            </h1>

            <p className="cs-banner-tagline">{study.tagline}</p>

            <div className="cs-banner-meta">
              <span className="cs-banner-tag">
                <HeroIcon size={14} strokeWidth={2.2} />
                {study.category}
              </span>
            </div>
          </div>
        </section>

        {/* ── Metrics Strip ── */}
        <section className="cs-metrics-section reveal" data-reveal>
          <div className="cs-metrics-grid">
            {study.metrics.map((m) => (
              <div className="cs-metric-card" key={m.label}>
                <div className="cs-metric-value">{m.value}</div>
                <div className="cs-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Content wrapped in a single container ── */}
        <section className="cs-content">
          <div className="cs-container reveal" data-reveal>
            <article className="cs-block">
              <div className="section-tag">Project Overview</div>
              <h2 className="cs-block-title">
                The <span className="accent">Story</span>
              </h2>
              <p className="cs-block-body">{study.overview}</p>
            </article>

            <div className="cs-divider" />

            <article className="cs-block">
              <div className="section-tag">The Challenge</div>
              <h2 className="cs-block-title">
                What We Had <span className="accent">to Solve</span>
              </h2>
              <ul className="cs-list">
                {study.challenges.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} strokeWidth={2} className="cs-list-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <div className="cs-divider" />

            <article className="cs-block">
              <div className="section-tag">Technical Solution</div>
              <h2 className="cs-block-title">
                How We <span className="accent">Engineered It</span>
              </h2>
              <div className="cs-subblocks">
                {study.solution.map((s) => (
                  <div className="cs-subblock" key={s.heading}>
                    <h3 className="cs-subblock-heading">{s.heading}</h3>
                    <p className="cs-subblock-body">{s.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="cs-divider" />

            <article className="cs-block">
              <div className="section-tag">Results</div>
              <h2 className="cs-block-title">
                Outcomes That <span className="accent">Mattered</span>
              </h2>
              <ul className="cs-list">
                {study.results.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} strokeWidth={2} className="cs-list-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <div className="cs-divider" />

            <article className="cs-block">
              <div className="section-tag">Technology Stack</div>
              <h2 className="cs-block-title">
                Built <span className="accent">With</span>
              </h2>
              <div className="cs-tags">
                {study.techStack.map((t) => (
                  <span className="cs-tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="cs-cta reveal" data-reveal>
            <h2 className="cs-cta-title">
              Have a project <span className="accent">like this one?</span>
            </h2>
            <p className="cs-cta-desc">
              Let&apos;s talk about how we can engineer it for you.
            </p>
            <Link to="/#contact" className="cs-cta-button">
              Start Your Project
              <ArrowUpRight size={18} strokeWidth={2.2} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
