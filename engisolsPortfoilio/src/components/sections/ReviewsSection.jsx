import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, Star, User } from 'lucide-react'

// `project` is the engagement the review came from; it renders under the
// reviewer's name. `avatar` is optional — add a real client photo URL to show
// one; when absent the Avatar component renders the default silhouette.
const testimonials = [
  {
    id: 1,
    name: 'Jonah Sachs',
    project: 'pastpresent.app',
    content: 'ENGISOLS is a pleasure to work with. They know their stuff and can complete complex projects. They think hard about solutions and are good communicators.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Matt Riley',
    project: 'ProLyrics.ai',
    content: 'ENGISOLS was hired to undertake my programming task out of many applicants and delivered flawlessly! Would definitely hire again :)',
    rating: 5,
  },
  {
    id: 3,
    name: 'Omar Hamza',
    project: 'Q&A Application',
    content: 'It was a nice experience working with ENGISOLS. The team is well versed in the technologies and quickly understands the requirements.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Lemar Simpson',
    project: 'SaaS Product',
    content: 'Good to work with the ENGISOLS team.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Fer Mell',
    project: 'Database Development',
    content: 'ENGISOLS is an excellent development team and a great partner. They fixed things swiftly and give great support. I will definitely keep working with them.',
    rating: 5,
  },
  {
    id: 6,
    name: 'Angela Zoe',
    project: 'Full-Stack AI Platform',
    content: 'Great job. ENGISOLS delivered the work on time with excellent quality and clear communication.',
    rating: 5,
  },
  {
    id: 7,
    name: 'Rachel Wade',
    project: 'TypeScript Integration',
    content: 'ENGISOLS resolved the errors promptly, ensuring smooth integration with the Flask endpoint.',
    rating: 5,
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

function Avatar({ src, name }) {
  const [errored, setErrored] = useState(false)
  if (src && !errored) {
    return (
      <img
        src={src}
        alt={`Avatar of ${name}, ENGISOLS client`}
        width="52"
        height="52"
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(221,62,94,0.3)',
        }}
      />
    )
  }
  // Default avatar — a neutral silhouette, shown when a client photo isn't
  // available. Deliberately generic: it claims nothing about who the reviewer is.
  return (
    <div
      role="img"
      aria-label={`${name}, ENGISOLS client`}
      style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'rgba(221,62,94,0.15)',
        border: '2px solid rgba(221,62,94,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#dd3e5e',
        flexShrink: 0,
      }}
    >
      <User size={24} strokeWidth={1.75} aria-hidden="true" />
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
            Real feedback from real clients across AI, SaaS, web, and data projects.
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
                    <Avatar src={current.avatar} name={current.name} />
                    <div>
                      <div className="reviews-v2-name">{current.name}</div>
                      <div className="reviews-v2-role">{current.project}</div>
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
