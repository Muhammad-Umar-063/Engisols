import { useState } from 'react'
import { FaReact, FaNodeJs, FaDocker, FaAws, FaGithub } from 'react-icons/fa'
import {
  SiNextdotjs,
  SiVercel,
  SiTypescript,
  SiMongodb,
  SiPostgresql,
  SiFigma,
  SiFlutter,
  SiGraphql,
  SiTailwindcss,
  SiFirebase,
  SiRedis,
} from 'react-icons/si'

const orbitRings = [
  {
    sizeRem: 16,
    durationS: 14,
    icons: [
      // { Icon: FaReact, color: '#61DAFB' },
      { Icon: FaNodeJs, color: '#68A063' },
      { Icon: SiNextdotjs, color: '#e0e0e0' },
      { Icon: SiTypescript, color: '#3178C6' },
      { Icon: FaDocker, color: '#2496ED' },
    ],
  },
  {
    sizeRem: 24,
    durationS: 22,
    icons: [
      { Icon: FaAws, color: '#FF9900' },
      { Icon: SiVercel, color: '#e0e0e0' },
      { Icon: FaGithub, color: '#e0e0e0' },
      { Icon: SiMongodb, color: '#47A248' },
      { Icon: SiPostgresql, color: '#5B9BD5' },
      { Icon: SiFigma, color: '#F24E1E' },
    ],
  },
  {
    sizeRem: 32,
    durationS: 32,
    icons: [
      { Icon: SiFlutter, color: '#54C5F8' },
      { Icon: SiGraphql, color: '#E10098' },
      { Icon: SiTailwindcss, color: '#38BDF8' },
      { Icon: SiFirebase, color: '#FFCA28' },
      { Icon: SiRedis, color: '#DC382D' },
    ],
  },
]

export default function ServicesSection() {
  const [showServices, setShowServices] = useState(false)

  return (
    <section id="services">

      {/* ── Orbit Tech-Stack Banner ── */}
      <div className="services-orbit-banner reveal" data-reveal>

        {/* Left: headline + CTA */}
        <div className="orbit-banner-left">
          <div className="section-tag">Our Tech Stack</div>
          <h2 className="section-title">
            Engineered with<br />
            <span className="accent">Modern Stack</span>
          </h2>
          <p className="section-desc orbit-banner-desc">
            From frontend to infrastructure — we build with the technologies
            that power the world&apos;s fastest-growing products.
          </p>
          <div className="orbit-banner-cta">
            <a href="#contact" className="btn-cta">Start Your Project →</a>
            <button
              className={`btn-cta-ghost${showServices ? ' open' : ''}`}
              onClick={() => setShowServices((prev) => !prev)}
            >
              {showServices ? 'Hide Services ↑' : 'View All Services ↓'}
            </button>
          </div>
        </div>

        {/* Right: orbiting icons */}
        <div className="orbit-banner-right">
          <div className="orbit-system">

            {/* Center circle */}
            <div className="orbit-center-circle">
              <FaReact style={{ width: '2rem', height: '2rem', color: '#61DAFB' }} />
            </div>

            {/* Orbit rings */}
            {orbitRings.map((ring, ringIdx) => {
              const angleStep = (2 * Math.PI) / ring.icons.length
              return (
                <div
                  key={ringIdx}
                  className="orbit-ring"
                  style={{
                    width: `${ring.sizeRem}rem`,
                    height: `${ring.sizeRem}rem`,
                    animationDuration: `${ring.durationS}s`,
                  }}
                >
                  {ring.icons.map((cfg, iconIdx) => {
                    const angle = iconIdx * angleStep
                    const x = 50 + 50 * Math.cos(angle)
                    const y = 50 + 50 * Math.sin(angle)
                    return (
                      <div
                        key={iconIdx}
                        className="orbit-icon-node"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          animationDuration: `${ring.durationS}s`,
                        }}
                      >
                        <cfg.Icon style={{ width: '1.1rem', height: '1.1rem', color: cfg.color }} />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Section header + cards (all collapsible) ── */}
      <div className={`services-grid-wrap${showServices ? ' open' : ''}`}>
        <div className="services-expand-inner">

          {/* Section header */}
          <div className="services-header">
            <div>
              <div className="section-tag">What We Do</div>
              <h2 className="section-title">
                Services Built for<br /><span className="accent">Modern Businesses</span>
              </h2>
            </div>
            <p className="section-desc">
              From idea to deployment — we cover the full engineering stack so you don&apos;t have to.
            </p>
          </div>

          {/* Service cards */}
          <div className="services-grid stagger-grid" data-stagger>

            <div className="service-card stagger-child" data-stagger-child>
              <div className="service-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Web Application Development</h3>
              <p>Full-stack web apps built with React, Next.js, Node.js, and modern cloud infrastructure that scale from day one.</p>
            </div>

            <div className="service-card stagger-child" data-stagger-child>
              <div className="service-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Mobile App Development</h3>
              <p>Native and cross-platform mobile apps for iOS and Android using React Native and Flutter, built for performance.</p>
            </div>

            <div className="service-card stagger-child" data-stagger-child>
              <div className="service-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3>UI / UX Design</h3>
              <p>Human-first interfaces that convert. From wireframes to polished design systems using Figma and design tokens.</p>
            </div>

            <div className="service-card stagger-child" data-stagger-child>
              <div className="service-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3>API & Backend Engineering</h3>
              <p>High-performance REST and GraphQL APIs, microservices architecture, and serverless backends that never sleep.</p>
            </div>

            <div className="service-card stagger-child" data-stagger-child>
              <div className="service-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3>Cloud & DevOps</h3>
              <p>AWS, GCP, and Azure deployments with CI/CD pipelines, containerization, and 24/7 monitoring that keeps you live.</p>
            </div>

            <div className="service-card stagger-child" data-stagger-child>
              <div className="service-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <h3>Database Architecture</h3>
              <p>Schema design, query optimization, and data modeling for PostgreSQL, MongoDB, and real-time databases at scale.</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
