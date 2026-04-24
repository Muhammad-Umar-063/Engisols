import { useRef } from 'react'

export default function ReviewsSection() {
  const trackRef = useRef(null)

  const scrollReviews = (direction) => {
    if (!trackRef.current) {
      return
    }

    trackRef.current.scrollBy({
      left: direction * 380,
      behavior: 'smooth',
    })
  }

  return (
    <section id="reviews">
      <div className="reviews-header">
        <div className="reveal" data-reveal>
          <div className="section-tag">Client Reviews</div>
     <h2 className="section-title">What Our <span className="accent">Clients Say</span></h2>
        </div>

        <div className="reviews-nav reveal" data-reveal>
          <button
            type="button"
            className="review-btn"
            onClick={() => scrollReviews(-1)}
            aria-label="Previous reviews"
          >
            ←
          </button>
          <button
            type="button"
            className="review-btn"
            onClick={() => scrollReviews(1)}
            aria-label="Next reviews"
          >
            →
          </button>
        </div>
      </div>

      <div ref={trackRef} className="reviews-track reveal" style={{ transitionDelay: '0.1s' }} data-reveal>
        <div className="review-card">
          <div className="review-quote-icon">&quot;</div>
          <p className="review-text">ENGISOLS transformed our outdated system into a modern, scalable platform. Their team delivered on time, on budget, and beyond expectations.</p>
          <div className="review-stars">
            <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
          </div>
          <div className="reviewer">
            <div className="reviewer-avatar">AR</div>
            <div>
              <div className="reviewer-name">A. Raza</div>
              <div className="reviewer-title">CEO, FinTech Labs</div>
            </div>
          </div>
        </div>

        <div className="review-card">
          <div className="review-quote-icon">&quot;</div>
          <p className="review-text">From design to deployment, they handled everything flawlessly. Communication was clear, and their technical depth is world-class.</p>
          <div className="review-stars">
            <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
          </div>
          <div className="reviewer">
            <div className="reviewer-avatar">SK</div>
            <div>
              <div className="reviewer-name">S. Khan</div>
              <div className="reviewer-title">Product Manager, HealthSync</div>
            </div>
          </div>
        </div>

        <div className="review-card">
          <div className="review-quote-icon">&quot;</div>
          <p className="review-text">We needed speed and quality. ENGISOLS gave us both. Their architecture decisions saved us months of rework later.</p>
          <div className="review-stars">
            <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
          </div>
          <div className="reviewer">
            <div className="reviewer-avatar">MN</div>
            <div>
              <div className="reviewer-name">M. Niazi</div>
              <div className="reviewer-title">CTO, RetailOS</div>
            </div>
          </div>
        </div>

        <div className="review-card">
          <div className="review-quote-icon">&quot;</div>
          <p className="review-text">Their mobile team is exceptional. Our app launch saw a 4.9 rating in the first week and zero critical crashes.</p>
          <div className="review-stars">
            <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
          </div>
          <div className="reviewer">
            <div className="reviewer-avatar">HB</div>
            <div>
              <div className="reviewer-name">H. Bilal</div>
              <div className="reviewer-title">Founder, MoveFast</div>
            </div>
          </div>
        </div>

        <div className="review-card">
          <div className="review-quote-icon">&quot;</div>
          <p className="review-text">Professional, proactive, and deeply technical. Working with ENGISOLS feels like having an in-house elite engineering team.</p>
          <div className="review-stars">
            <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
          </div>
          <div className="reviewer">
            <div className="reviewer-avatar">ZR</div>
            <div>
              <div className="reviewer-name">Z. Rahman</div>
              <div className="reviewer-title">Director, NovaWare</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
