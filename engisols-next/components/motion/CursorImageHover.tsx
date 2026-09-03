'use client'

import { m, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Case study rows with a cursor-trailing thumbnail — animation spec 8.2.
 *
 * The floating image tracks a softer spring than the cursor itself
 * ({ stiffness: 180, damping: 24, mass: 0.6 }, per spec) and sits +24,+24
 * below-right of the pointer. Images swap through AnimatePresence mode="wait".
 *
 * When pointer FX are off — touch, reduced motion — every row shows its
 * thumbnail INLINE instead. The image must be reachable without a pointer;
 * hiding it behind a hover state would make it desktop-only decoration.
 */

export type WorkRow = {
  id: string
  label: string
  meta?: string
  img: string
  href: string
}

export function CursorImageHover({ items }: { items: WorkRow[] }) {
  const { allowPointerFX } = useMotionPrefs()
  const [hovered, setHovered] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 24, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 180, damping: 24, mass: 0.6 })

  useEffect(() => {
    const el = containerRef.current
    if (!allowPointerFX || !el) return
    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect()
      x.set(e.clientX - box.left + 24)
      y.set(e.clientY - box.top + 24)
    }
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => el.removeEventListener('pointermove', onMove)
  }, [allowPointerFX, x, y])

  const active = items.find((i) => i.id === hovered)

  return (
    <div ref={containerRef} className="relative" onPointerLeave={() => setHovered(null)}>
      <ul className="divide-y divide-bordeaux/15 border-y border-bordeaux/15">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              onPointerEnter={() => setHovered(item.id)}
              onFocus={() => setHovered(item.id)}
              className="flex flex-wrap items-center justify-between gap-step-2 py-step-3 no-underline transition-opacity duration-200"
              style={{
                opacity: hovered && hovered !== item.id ? 0.45 : 1,
                transitionTimingFunction: 'var(--ease-micro)',
              }}
            >
              <span className="flex items-center gap-step-3">
                {/* Inline thumbnail is the accessible baseline; the floating
                    preview is decoration on top for fine pointers. */}
                {!allowPointerFX ? (
                  <img
                    src={item.img}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-sm object-cover"
                  />
                ) : null}
                <span className="font-display text-[clamp(1.5rem,3vw,2.25rem)]">
                  {item.label}
                </span>
              </span>
              {item.meta ? (
                <span className="font-mono text-sm text-bordeaux/60">{item.meta}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>

      {allowPointerFX ? (
        <m.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 w-64"
          style={{ x: sx, y: sy }}
        >
          <AnimatePresence mode="wait">
            {active ? (
              <m.img
                key={active.id}
                src={active.img}
                alt=""
                className="block h-40 w-full rounded-sm object-cover shadow-xl"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14, ease: EASE.micro } }}
                transition={{ duration: 0.2, ease: EASE.enter }}
              />
            ) : null}
          </AnimatePresence>
        </m.div>
      ) : null}
    </div>
  )
}
