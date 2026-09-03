'use client'

import { m, motionValue, useSpring, type MotionValue } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'

/**
 * Capability grid — animation spec section 9. The single show-off moment.
 *
 * The pointer pushes nearby tags gently away and lifts them, falloff by
 * distance, springing back on exit.
 *
 * Spec 9.2 calls this "the animation an agent is most likely to build wrong",
 * and names the failure: pointer position in React state, re-rendering 16
 * cells per frame. Here each cell owns motionValues wrapped in springs; one
 * pointermove handler writes to them directly. React renders once, on mount,
 * and never again during interaction.
 *
 * Cell rects are cached on mount and resize — reading layout inside a pointer
 * handler forces reflow.
 *
 * Spec values: radius 180, max displacement 12px, max scale 1.06, springs
 * { stiffness: 260, damping: 24 } — snappier than the global spring on purpose.
 */

const RADIUS = 180
const PUSH = 12
const LIFT = 0.06
const SPRING = { stiffness: 260, damping: 24 }

type Cell = { x: MotionValue<number>; y: MotionValue<number>; s: MotionValue<number> }

function Tag({ label, cell }: { label: string; cell: Cell }) {
  const x = useSpring(cell.x, SPRING)
  const y = useSpring(cell.y, SPRING)
  const scale = useSpring(cell.s, SPRING)

  return (
    <m.li
      style={{ x, y, scale }}
      className="rounded-full border border-vanilla/30 px-step-3 py-step-1 font-mono text-sm text-vanilla will-change-transform"
    >
      {label}
    </m.li>
  )
}

export function CollisionGrid({ items }: { items: string[] }) {
  const gridRef = useRef<HTMLUListElement>(null)
  const { allowPointerFX } = useMotionPrefs()

  // Stable per-cell motion values; springs live in each Tag.
  const cells = useMemo<Cell[]>(
    () => items.map(() => ({ x: motionValue(0), y: motionValue(0), s: motionValue(1) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length],
  )
  const rects = useRef<{ cx: number; cy: number }[]>([])

  useEffect(() => {
    const grid = gridRef.current
    if (!allowPointerFX || !grid) return

    const cache = () => {
      const box = grid.getBoundingClientRect()
      rects.current = Array.from(grid.children).map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect()
        return { cx: r.left - box.left + r.width / 2, cy: r.top - box.top + r.height / 2 }
      })
    }
    cache()
    window.addEventListener('resize', cache)

    const onMove = (e: PointerEvent) => {
      const box = grid.getBoundingClientRect()
      const px = e.clientX - box.left
      const py = e.clientY - box.top

      rects.current.forEach((r, i) => {
        const dx = r.cx - px
        const dy = r.cy - py
        const dist = Math.hypot(dx, dy)
        const falloff = Math.max(0, 1 - dist / RADIUS)
        cells[i].x.set((dx / (dist || 1)) * falloff * PUSH)
        cells[i].y.set((dy / (dist || 1)) * falloff * PUSH)
        cells[i].s.set(1 + falloff * LIFT)
      })
    }

    const onLeave = () => {
      // Zero the targets; the springs handle the settle.
      cells.forEach((c) => {
        c.x.set(0)
        c.y.set(0)
        c.s.set(1)
      })
    }

    grid.addEventListener('pointermove', onMove)
    grid.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('resize', cache)
      grid.removeEventListener('pointermove', onMove)
      grid.removeEventListener('pointerleave', onLeave)
    }
  }, [allowPointerFX, cells])

  // Static fallback: still a readable capability list, with a border change on
  // hover and focus rather than motion.
  if (!allowPointerFX) {
    return (
      <ul className="flex flex-wrap gap-step-2">
        {items.map((item) => (
          <li
            key={item}
            tabIndex={0}
            className="rounded-full border border-vanilla/30 px-step-3 py-step-1 font-mono text-sm text-vanilla transition-colors hover:border-vanilla focus-visible:border-vanilla"
          >
            {item}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul ref={gridRef} className="flex flex-wrap gap-step-2">
      {items.map((item, i) => (
        <Tag key={item} label={item} cell={cells[i]} />
      ))}
    </ul>
  )
}
