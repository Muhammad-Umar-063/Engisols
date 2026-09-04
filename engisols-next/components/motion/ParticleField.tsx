'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Interactive particle network — ported from the previous site's hero.
 *
 * Palette translation, second pass. The field is INVERTED: the hero ground is
 * oat and the network is bordeaux drawn on top of it, where it used to be a
 * light network on a dark ground. The pair is the same one either way —
 * bordeaux against oat is 9.06 — so nothing was lost in the swap; what changed
 * is which of the two is the ink.
 *
 * Only the alpha travels with the pointer now, not the colour. The old version
 * had a second colour to move to (greige lines brightening to vanilla) and
 * this one does not: the palette's other dark is cherry, which rule 2 bars
 * from hairlines, and greige is 1.62 from oat — invisible on this ground. So
 * proximity deepens the same bordeaux from 0.35 to 0.85. One colour, two
 * weights.
 *
 * Line weight is the one thing that does not carry across the inversion. Dark
 * ink on a light ground reads heavier than light ink on a dark one at equal
 * width — the same asymmetry optical sizes exist for — so the number that was
 * right for the old scheme is too heavy for this one. 2, down from the 3 that
 * suited the light-on-dark version: at 3 the dense clusters, where six or
 * seven lines meet inside a few pixels, filled in as solid patches and started
 * competing with the headline. 2 keeps the extra weight everywhere the network
 * is sparse, which is most of it.
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

const PARTICLE = 'rgba(67, 33, 42, 0.75)' // bordeaux
const LINE_INK = '67, 33, 42' // bordeaux
/** Distance-fade alpha: at rest, and while the pair is within pointer range. */
const LINE_ALPHA = { base: 0.35, near: 0.85 }
/** CSS pixels. The context is already scaled by dpr, so this is device-independent. */
const LINE_WIDTH = 1.5

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
      // Line width is set once per frame, not per pair: it is a constant, and
      // the pair loop runs thousands of times a frame. Assigning it here rather
      // than at setup is deliberate — writing `canvas.width` in `resize` resets
      // the whole 2D context state, and this survives that.
      ctx.lineWidth = LINE_WIDTH
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
          ctx.strokeStyle = `rgba(${LINE_INK}, ${
            opacity * (nearPointer ? LINE_ALPHA.near : LINE_ALPHA.base)
          })`
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
