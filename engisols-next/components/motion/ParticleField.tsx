'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Interactive particle network — ported from the previous site's hero.
 *
 * Palette translation: the original drew crimson particles and crimson lines.
 * Cherry cannot do that job here — it sits 2.02 against bordeaux and would be
 * invisible as hairlines. Greige is the token whose stated job is "rules and
 * borders" (6.89 on bordeaux), so lines are greige and particles are vanilla,
 * brightening to vanilla on pointer proximity.
 *
 * Performance notes — the original had two problems at scale:
 *  - The connect pass is O(n²). At the old cap of 140 particles that is ~9,700
 *    distance checks per frame. Particle count is now derived from area and
 *    capped lower, and the squared distance is compared without a sqrt.
 *  - It ran on every device. This is gated behind (pointer: fine), so phones —
 *    where the interaction is impossible anyway — get a static gradient instead
 *    of burning battery on an effect nobody can trigger.
 *
 * Decorative only: aria-hidden, mounts after hydration, and never carries copy.
 * Reduced motion switches it off entirely rather than slowing it down.
 */

const PARTICLE = 'rgba(240, 231, 219, 0.7)' // vanilla
const LINE_BASE = '179, 160, 145' // greige
const LINE_NEAR = '240, 231, 219' // vanilla

type P = { x: number; y: number; dx: number; dy: number; r: number }

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)')
    const update = () => setEnabled(fine.matches && !reduced)
    update()
    fine.addEventListener('change', update)
    return () => fine.removeEventListener('change', update)
  }, [reduced])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!enabled || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let particles: P[] = []
    const mouse = { x: -9999, y: -9999, radius: 180 }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // clientWidth/Height, not getBoundingClientRect: this canvas lives inside
    // the hero's scaled layer, so the bounding rect reports the VISUAL size —
    // at scale 1.32 a resize mid-scroll would allocate a backing store 32% too
    // large and thin the particle density to match. Layout size is what the
    // drawing is in.
    let width = 0
    let height = 0

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(110, Math.max(30, (width * height) / 14000))
      particles = Array.from({ length: Math.floor(count) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        dx: Math.random() * 0.4 - 0.2,
        dy: Math.random() * 0.4 - 0.2,
        r: Math.random() * 1.6 + 0.7,
      }))
    }

    // The bounds come from `resize`, not from a per-frame measurement: reading
    // a bounding rect inside the animation loop forces a layout on every frame,
    // and inside the hero's scaled layer it would return the visual size rather
    // than the one the canvas is drawn in.
    const frame = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        if (p.x > width || p.x < 0) p.dx = -p.dx
        if (p.y > height || p.y < 0) p.dy = -p.dy

        // Push away from the pointer.
        const mdx = mouse.x - p.x
        const mdy = mouse.y - p.y
        const md = Math.hypot(mdx, mdy)
        if (md < mouse.radius && md > 0) {
          const force = (mouse.radius - md) / mouse.radius
          p.x -= (mdx / md) * force * 4
          p.y -= (mdy / md) * force * 4
        }

        p.x += p.dx
        p.y += p.dy

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = PARTICLE
        ctx.fill()
      }

      // Connect pass. Squared distances throughout — no sqrt in the inner loop.
      const maxSq = 20000
      const mouseSq = mouse.radius * mouse.radius
      for (let a = 0; a < particles.length; a++) {
        const pa = particles[a]
        const nearPointer =
          (pa.x - mouse.x) ** 2 + (pa.y - mouse.y) ** 2 < mouseSq
        for (let b = a + 1; b < particles.length; b++) {
          const pb = particles[b]
          const distSq = (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2
          if (distSq >= maxSq) continue
          const opacity = 1 - distSq / maxSq
          ctx.strokeStyle = nearPointer
            ? `rgba(${LINE_NEAR}, ${opacity * 0.9})`
            : `rgba(${LINE_BASE}, ${opacity * 0.4})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pa.x, pa.y)
          ctx.lineTo(pb.x, pb.y)
          ctx.stroke()
        }
      }

      raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    frame()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ opacity: enabled ? 1 : 0 }}
    />
  )
}
