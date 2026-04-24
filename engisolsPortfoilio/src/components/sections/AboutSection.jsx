export default function AboutSection() {
  return (
    <section id="about">
      <div className="about-visual reveal" data-reveal>
        <div className="about-logo-box">
          <img src="/engisols-mark.svg" alt="ENGISOLS mark" />
        </div>

        <div className="about-badges">
          <div className="about-badge">
            <div className="about-badge-dot" />
            ISO 9001 Certified
          </div>
          <div className="about-badge">
            <div className="about-badge-dot" />
            Agile Methodology
          </div>
        </div>
      </div>

      <div className="about-text reveal" style={{ transitionDelay: '0.1s' }} data-reveal>
        <div className="section-tag">About ENGISOLS</div>
      <h2 className="section-title">Engineering Solutions<br />That <span className="accent">Scale With You</span></h2>
        <p className="section-desc">
          EngiSols is a modern software development company built for a world that never slows down. We design and engineer intelligent digital solutions that power growth, scale ideas, and solve real-world problems with precision.
        </p>

        <div className="about-pillars" data-stagger>
          <div className="about-pillar stagger-child" data-stagger-child>
            <div className="about-pillar-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4>Speed & Precision</h4>
            <p>Fast delivery without compromising on quality or engineering standards.</p>
          </div>

          <div className="about-pillar stagger-child" data-stagger-child>
            <div className="about-pillar-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4>Reliability</h4>
            <p>Battle-tested architectures with proven uptime and security built in.</p>
          </div>

          <div className="about-pillar stagger-child" data-stagger-child>
            <div className="about-pillar-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h4>Transparency</h4>
            <p>Full project visibility, clear milestones, and honest communication.</p>
          </div>

          <div className="about-pillar stagger-child" data-stagger-child>
            <div className="about-pillar-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h4>Partnership</h4>
            <p>We don&apos;t just deliver — we become an extension of your team.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
