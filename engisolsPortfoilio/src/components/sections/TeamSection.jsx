export default function TeamSection() {
  return (
    <section id="team">
      <div className="team-header reveal" data-reveal>
        <div className="section-tag" style={{ justifyContent: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Our Team</div>
        <h2 className="section-title">The Engineers Behind<br/><span className="accent">Every Solution</span></h2>
        <p className="section-desc">
          A tight-knit team of builders, designers, and strategists who care deeply about the work we ship.
        </p>
      </div>

      <div className="team-grid reveal" style={{ transitionDelay: '0.1s' }} data-reveal>
        <div className="team-card">
          <div className="team-avatar">
            <div className="team-avatar-bg" />
            <span className="team-initials">AK</span>
          </div>
          <div className="team-info">
            <h3 className="team-name">Ali Khan</h3>
            <div className="team-role">Founder &amp; CEO</div>
            <p className="team-bio">Visionary engineer with 10+ years building products that have served millions of users globally.</p>
            <div className="team-socials">
              <a href="#" className="team-social">in</a>
              <a href="#" className="team-social">tw</a>
            </div>
          </div>
        </div>

        <div className="team-card">
          <div className="team-avatar">
            <div className="team-avatar-bg" />
            <span className="team-initials">SR</span>
          </div>
          <div className="team-info">
            <h3 className="team-name">Sara Rehman</h3>
            <div className="team-role">Lead UI/UX Designer</div>
            <p className="team-bio">Crafts experiences that feel effortless. 7 years in product design across SaaS and fintech.</p>
            <div className="team-socials">
              <a href="#" className="team-social">in</a>
              <a href="#" className="team-social">be</a>
            </div>
          </div>
        </div>

        <div className="team-card">
          <div className="team-avatar">
            <div className="team-avatar-bg" />
            <span className="team-initials">OM</span>
          </div>
          <div className="team-info">
            <h3 className="team-name">Omar Mirza</h3>
            <div className="team-role">Backend Architect</div>
            <p className="team-bio">Systems thinker specializing in high-performance APIs, distributed systems, and database optimization.</p>
            <div className="team-socials">
              <a href="#" className="team-social">gh</a>
              <a href="#" className="team-social">in</a>
            </div>
          </div>
        </div>

        <div className="team-card">
          <div className="team-avatar">
            <div className="team-avatar-bg" />
            <span className="team-initials">FN</span>
          </div>
          <div className="team-info">
            <h3 className="team-name">Fatima Nawaz</h3>
            <div className="team-role">Frontend Engineer</div>
            <p className="team-bio">Pixel-perfect React developer obsessed with performance, accessibility, and animation.</p>
            <div className="team-socials">
              <a href="#" className="team-social">gh</a>
              <a href="#" className="team-social">tw</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}