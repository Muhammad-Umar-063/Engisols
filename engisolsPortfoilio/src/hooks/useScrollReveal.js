import { useEffect } from 'react'

function parseDelay(value) {
  if (!value) return 0
  const trimmed = value.trim()
  if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed)
  if (trimmed.endsWith('s')) return Number.parseFloat(trimmed) * 1000
  const numeric = Number.parseFloat(trimmed)
  return Number.isFinite(numeric) ? numeric * 1000 : 0
}

export function useScrollReveal() {
  useEffect(() => {
    const timers = []
    const observers = []
    const teardownFns = []

    /* ─── REVEAL ─── */
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('visible', 'in')
          revealObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    observers.push(revealObserver)
    document
      .querySelectorAll('.reveal, [data-reveal]')
      .forEach((el) => revealObserver.observe(el))

    /* ─── STAGGER ─── */
    const staggerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const children = entry.target.querySelectorAll(
            '.stagger-child, [data-stagger-child]',
          )
          children.forEach((child, i) => {
            const t = window.setTimeout(() => child.classList.add('in'), i * 120)
            timers.push(t)
          })
          staggerObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' },
    )
    observers.push(staggerObserver)
    document
      .querySelectorAll('[data-stagger]')
      .forEach((el) => staggerObserver.observe(el))

    /* ─── HERO STAGGER ENTRANCE ─── */
    document.querySelectorAll('.hero-animate').forEach((el) => {
      const delay = parseDelay(el.style.getPropertyValue('--d'))
      const t = window.setTimeout(() => el.classList.add('in'), delay + 180)
      timers.push(t)
    })

    /* ─── COUNT-UP ─── */
    function animateCounter(el, duration = 1400) {
      const target = Number.parseInt(el.dataset.target || '0', 10)
      const suffix = el.dataset.suffix || ''
      const start = performance.now()
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        el.textContent = `${Math.floor(eased * target)}${suffix}`
        if (p < 1) window.requestAnimationFrame(step)
      }
      window.requestAnimationFrame(step)
    }

    const counterTimer = window.setTimeout(() => {
      document.querySelectorAll('.count-up').forEach((el) => animateCounter(el))
    }, 900)
    timers.push(counterTimer)

    /* ─── CURSOR SPOTLIGHT ─── */
    const spotlight = document.getElementById('cursor-spotlight')
    const hero = document.getElementById('home')
    const handleMouseMove = (e) => {
      if (!spotlight || !hero) return
      const rect = hero.getBoundingClientRect()
      const inHero =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      if (!inHero) {
        spotlight.style.opacity = '0'
        return
      }
      spotlight.style.opacity = '1'
      spotlight.style.left = e.clientX + 'px'
      spotlight.style.top = e.clientY + 'px'
    }
    document.addEventListener('mousemove', handleMouseMove)
    teardownFns.push(() => document.removeEventListener('mousemove', handleMouseMove))

    /* ─── PARTICLES (upward floating with lifecycle fade) ─── */
    const canvas = document.getElementById('hero-particles')
    const ctx = canvas?.getContext('2d')
    let animFrameId = 0

    if (canvas && ctx && hero) {
      let W = 0
      let H = 0

      const resize = () => {
        W = canvas.width = hero.offsetWidth
        H = canvas.height = hero.offsetHeight
      }
      resize()
      window.addEventListener('resize', resize)
      teardownFns.push(() => {
        window.removeEventListener('resize', resize)
        window.cancelAnimationFrame(animFrameId)
      })

      class Particle {
        constructor() {
          this.reset()
        }
        reset() {
          this.x = Math.random() * W
          this.y = Math.random() * H
          this.r = Math.random() * 1.5 + 0.4
          this.vx = (Math.random() - 0.5) * 0.35
          this.vy = -(Math.random() * 0.5 + 0.1)
          this.alpha = Math.random() * 0.5 + 0.15
          this.life = 0
          this.maxLife = Math.random() * 300 + 200
        }
        update() {
          this.x += this.vx
          this.y += this.vy
          this.life++
          if (this.life > this.maxLife || this.y < -5) this.reset()
        }
        draw() {
          const fade =
            this.life < 40
              ? this.life / 40
              : this.life > this.maxLife - 40
              ? (this.maxLife - this.life) / 40
              : 1
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(221,62,94,${this.alpha * fade})`
          ctx.fill()
        }
      }

      const particles = Array.from({ length: 70 }, () => {
        const p = new Particle()
        p.life = Math.floor(Math.random() * p.maxLife)
        return p
      })

      const loop = () => {
        ctx.clearRect(0, 0, W, H)
        particles.forEach((p) => {
          p.update()
          p.draw()
        })
        animFrameId = window.requestAnimationFrame(loop)
      }
      loop()
    }

    /* ─── 3D TILT CARDS ─── */
    document
      .querySelectorAll('.team-card, .pricing-card, .review-card')
      .forEach((card) => {
        const onMove = (e) => {
          const r = card.getBoundingClientRect()
          const x = ((e.clientX - r.left) / r.width - 0.5) * 12
          const y = -((e.clientY - r.top) / r.height - 0.5) * 12
          card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`
        }
        const onLeave = () => {
          card.style.transform = ''
        }
        card.addEventListener('mousemove', onMove)
        card.addEventListener('mouseleave', onLeave)
        teardownFns.push(() => {
          card.removeEventListener('mousemove', onMove)
          card.removeEventListener('mouseleave', onLeave)
        })
      })

    /* ─── HERO FORM CARD TILT ─── */
    const formCard = document.querySelector('.hero-form-card')
    if (formCard) {
      const onMove = (e) => {
        const r = formCard.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width - 0.5) * 6
        const y = -((e.clientY - r.top) / r.height - 0.5) * 6
        formCard.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`
      }
      const onLeave = () => {
        formCard.style.transform = ''
      }
      formCard.addEventListener('mousemove', onMove)
      formCard.addEventListener('mouseleave', onLeave)
      teardownFns.push(() => {
        formCard.removeEventListener('mousemove', onMove)
        formCard.removeEventListener('mouseleave', onLeave)
      })
    }

    /* ─── MAGNETIC BUTTONS ─── */
    document.querySelectorAll('.btn-primary, .nav-cta').forEach((btn) => {
      const onMove = (e) => {
        const r = btn.getBoundingClientRect()
        const mx = (e.clientX - r.left - r.width / 2) * 0.25
        const my = (e.clientY - r.top - r.height / 2) * 0.25
        btn.style.transform = `translate(${mx}px, ${my}px)`
      }
      const onLeave = () => {
        btn.style.transform = ''
      }
      btn.addEventListener('mousemove', onMove)
      btn.addEventListener('mouseleave', onLeave)
      teardownFns.push(() => {
        btn.removeEventListener('mousemove', onMove)
        btn.removeEventListener('mouseleave', onLeave)
      })
    })

    /* ─── WORD REVEAL ─── */
    document.querySelectorAll('.section-title').forEach((title) => {
      // Only split words into spans once — but always (re-)create the observer
      // so that React Strict Mode's double-invoke of effects doesn't leave
      // titles permanently invisible after the first observer is disconnected.
      if (title.dataset.wordRevealInit !== 'true') {
        title.dataset.wordRevealInit = 'true'

        const original = title.innerHTML
        const tokens = original
          .split(/(<br\s*\/?>|<span class="accent">.*?<\/span>)/g)
          .filter(Boolean)

        const wrapped = tokens
          .map((token) => {
            if (/^<br\s*\/?/i.test(token)) return token
            if (/^<span class="accent">.*<\/span>$/.test(token)) {
              const inner = token
                .replace('<span class="accent">', '')
                .replace('</span>', '')
              const words = inner
                .split(/(\s+)/)
                .map((part) =>
                  part.trim() ? `<span class="word">${part}</span>` : part,
                )
                .join('')
              return `<span class="accent">${words}</span>`
            }
            return token
              .split(/(\s+)/)
              .map((part) =>
                part.trim() ? `<span class="word">${part}</span>` : part,
              )
              .join('')
          })
          .join('')

        title.innerHTML = wrapped
        title.classList.add('word-reveal')
      }

      const words = title.querySelectorAll('.word')
      const titleObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            words.forEach((word, i) => {
              const t = window.setTimeout(() => word.classList.add('in'), i * 42)
              timers.push(t)
            })
            titleObs.unobserve(entry.target)
          })
        },
        { threshold: 0.18 },
      )
      observers.push(titleObs)
      titleObs.observe(title)
    })

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      observers.forEach((o) => o.disconnect())
      teardownFns.forEach((fn) => fn())
    }
  }, [])
}
