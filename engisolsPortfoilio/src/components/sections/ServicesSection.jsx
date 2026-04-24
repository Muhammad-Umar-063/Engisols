export default function ServicesSection() {

  return (
    <section id="services">
      <div className="services-header reveal" data-reveal>
        <div>
          <div className="section-tag">What We Do</div>
      <h2 className="section-title">Services Built for<br/><span className="accent">Modern Businesses</span></h2>
        </div>

        <p className="section-desc">From idea to deployment — we cover the full engineering stack so you don&apos;t have to.</p>
      </div>

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
    </section>
  )
}
