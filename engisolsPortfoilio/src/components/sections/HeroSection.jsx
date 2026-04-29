import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

const PARTICLE_COLOR = 'rgba(221, 62, 94, 0.85)'
const LINE_COLOR_BASE = 'rgba(221, 62, 94'
const LINE_COLOR_HOVER = 'rgba(255, 200, 210'

export default function HeroSection() {
  const canvasRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []
    const mouse = { x: null, y: null, radius: 180 }

    class Particle {
      constructor(x, y, dirX, dirY, size) {
        this.x = x
        this.y = y
        this.dirX = dirX
        this.dirY = dirY
        this.size = size
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = PARTICLE_COLOR
        ctx.fill()
      }
      update() {
        if (this.x > canvas.width || this.x < 0) this.dirX = -this.dirX
        if (this.y > canvas.height || this.y < 0) this.dirY = -this.dirY

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < mouse.radius + this.size && distance > 0) {
            const fX = dx / distance
            const fY = dy / distance
            const force = (mouse.radius - distance) / mouse.radius
            this.x -= fX * force * 4
            this.y -= fY * force * 4
          }
        }

        this.x += this.dirX
        this.y += this.dirY
        this.draw()
      }
    }

    function init() {
      particles = []
      const target = (canvas.height * canvas.width) / 11000
      const numberOfParticles = Math.min(140, Math.max(40, target))
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 1.8 + 0.8
        const x = Math.random() * (canvas.width - size * 4) + size * 2
        const y = Math.random() * (canvas.height - size * 4) + size * 2
        const dirX = Math.random() * 0.4 - 0.2
        const dirY = Math.random() * 0.4 - 0.2
        particles.push(new Particle(x, y, dirX, dirY, size))
      }
    }

    const resizeCanvas = () => {
      const rect = section.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      init()
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    const connect = () => {
      const maxDistSq = (canvas.width / 7) * (canvas.height / 7)
      const mouseRadiusSq = mouse.radius * mouse.radius

      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const pa = particles[a]
          const pb = particles[b]
          const dx = pa.x - pb.x
          const dy = pa.y - pb.y
          const distSq = dx * dx + dy * dy

          if (distSq < maxDistSq) {
            const opacity = 1 - distSq / 20000
            if (opacity <= 0) continue

            let near = false
            if (mouse.x !== null) {
              const mdx = pa.x - mouse.x
              const mdy = pa.y - mouse.y
              if (mdx * mdx + mdy * mdy < mouseRadiusSq) near = true
            }

            ctx.strokeStyle = near
              ? `${LINE_COLOR_HOVER}, ${opacity})`
              : `${LINE_COLOR_BASE}, ${opacity * 0.55})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pa.x, pa.y)
            ctx.lineTo(pb.x, pb.y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) particles[i].update()
      connect()
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const handleMouseOut = () => {
      mouse.x = null
      mouse.y = null
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseout', handleMouseOut)

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseOut)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const fadeUp = {
    hidden: { opacity: 0, y: 22 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.16 + 0.3,
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  }

  return (
    <section id="home" ref={sectionRef}>
      <canvas ref={canvasRef} className="hero-net-canvas" aria-hidden="true" />

      <div className="hero-net-overlay">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="hero-net-badge"
        >
          <span className="hero-net-badge-dot" />
          Available for New Projects
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="hero-net-title"
        >
          We Engineer
          <br />
          <span className="accent">What&apos;s Next.</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="hero-net-sub"
        >
          ENGISOLS — intelligent digital solutions for a world that never slows down.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="hero-net-stats"
        >
          <div className="hero-net-stat">
            <div className="hero-net-stat-num">120+</div>
            <div className="hero-net-stat-label">Projects Delivered</div>
          </div>
          <div className="hero-net-stat">
            <div className="hero-net-stat-num">98%</div>
            <div className="hero-net-stat-label">Client Retention</div>
          </div>
          <div className="hero-net-stat">
            <div className="hero-net-stat-num">5yr+</div>
            <div className="hero-net-stat-label">Industry Experience</div>
          </div>
        </motion.div>

        <motion.a
          href="#about"
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="hero-net-explore"
        >
          Scroll to Explore
          <ArrowDown size={16} strokeWidth={2.4} />
        </motion.a>
      </div>
    </section>
  )
}
