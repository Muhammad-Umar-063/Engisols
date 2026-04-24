import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'A. Raza',
    role: 'CEO',
    company: 'FinTech Labs',
    content: 'ENGISOLS transformed our outdated system into a modern, scalable platform. Their team delivered on time, on budget, and beyond expectations.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    initials: 'AR',
  },
  {
    id: 2,
    name: 'S. Khan',
    role: 'Product Manager',
    company: 'HealthSync',
    content: 'From design to deployment, they handled everything flawlessly. Communication was clear, and their technical depth is world-class.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    initials: 'SK',
  },
  {
    id: 3,
    name: 'M. Niazi',
    role: 'CTO',
    company: 'RetailOS',
    content: 'We needed speed and quality. ENGISOLS gave us both. Their architecture decisions saved us months of rework later.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    initials: 'MN',
  },
  {
    id: 4,
    name: 'H. Bilal',
    role: 'Founder',
    company: 'MoveFast',
    content: 'Their mobile team is exceptional. Our app launch saw a 4.9 rating in the first week and zero critical crashes.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/54.jpg',
    initials: 'HB',
  },
  {
    id: 5,
    name: 'Z. Rahman',
    role: 'Director',
    company: 'NovaWare',
    content: 'Professional, proactive, and deeply technical. Working with ENGISOLS feels like having an in-house elite engineering team.',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    initials: 'ZR',
  },
]

const cardVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  }),
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function Avatar({ src, initials }) {
  const [errored, setErrored] = useState(false)
  if (!errored) {
    return (
      <img
        src={src}
        alt={initials}
        width="52"
        height="52"
        loading="lazy"
        onError={() => setErrored(true)}
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(221,62,94,0.3)',
        }}
      />
    )
  }
  return (
    <div style={{
      width: '52px', height: '52px', borderRadius: '50%',
      background: 'rgba(221,62,94,0.15)',
      border: '2px solid rgba(221,62,94,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.85rem', fontWeight: 700,
      color: '#dd3e5e',
      fontFamily: "'Bricolage Grotesque', sans-serif",
    }}>
      {initials}
    </div>
  )
}

export default function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) controls.start('visible')
  }, [isInView, controls])

  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1)
      setActiveIndex(prev => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const go = (dir) => {
    setDirection(dir)
    setActiveIndex(prev => (prev + dir + testimonials.length) % testimonials.length)
  }

  const current = testimonials[activeIndex]

  return (
    <section id="reviews" ref={sectionRef}>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="reviews-v2-inner"
      >
        {/* ── Header ── */}
        <motion.div variants={itemVariants} className="reviews-v2-header">
          <div className="section-tag">Client Reviews</div>
          <h2 className="section-title">
            What Our <span className="accent">Clients Say</span>
          </h2>
          <p className="section-desc" style={{ marginTop: '0.5rem' }}>
            Real feedback from real clients across fintech, health, retail, and more.
          </p>
        </motion.div>

        {/* ── Card + Nav row ── */}
        <motion.div variants={itemVariants} className="reviews-v2-body">

          {/* Animated card */}
          <div className="reviews-v2-card-area">
            {/* Quote watermark — static, above all card slides */}
            <div className="reviews-v2-quote-bg" aria-hidden>
              <Quote strokeWidth={0.8} />
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="reviews-v2-card"
              >
                {/* Reviewer row */}
                <div className="reviews-v2-reviewer-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <Avatar src={current.avatar} initials={current.initials} />
                    <div>
                      <div className="reviews-v2-name">{current.name}</div>
                      <div className="reviews-v2-role">{current.role}, {current.company}</div>
                    </div>
                  </div>
                  <div className="reviews-v2-stars">
                    {[...Array(current.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="reviews-v2-sep" />

                {/* Quote text */}
                <p className="reviews-v2-text">
                  &ldquo;{current.content}&rdquo;
                </p>

                {/* Verified badge */}
                <div className="reviews-v2-verified">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#dd3e5e" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Verified Client
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="reviews-v2-nav">
            <button
              className="reviews-v2-btn"
              onClick={() => go(-1)}
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="reviews-v2-dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`reviews-v2-dot${i === activeIndex ? ' active' : ''}`}
                  onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i) }}
                  aria-label={`Go to review ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="reviews-v2-btn"
              onClick={() => go(1)}
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
