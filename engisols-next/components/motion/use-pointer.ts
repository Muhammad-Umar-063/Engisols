'use client'

import { motionValue } from 'motion/react'
import { useEffect, useState } from 'react'

/**
 * Pointer position as shared motion values.
 *
 * NOT in this repo's source drop — `cursor.tsx` imports it and it never
 * arrived, so this is written against its call sites. Replace it if the
 * official version turns up.
 *
 * Module scope is deliberate. The cursor's fill and its trailing ring are two
 * components reading the same pointer, and a context or a prop would make each
 * read cost a React render. These are motion values: written once per
 * pointermove, read on the frame loop, never through React at all. The whole
 * cursor system causes two renders in its lifetime.
 *
 * They start off-screen rather than at 0,0 so nothing flashes in the top-left
 * corner before the first real pointer event arrives.
 */
export const pointerX = motionValue(-100)
export const pointerY = motionValue(-100)

/** True only on devices with a precise pointer. Re-evaluates if that changes. */
export function useFinePointer() {
  const [fine, setFine] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(pointer: fine)')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFine(query.matches)
    const update = (event: MediaQueryListEvent) => setFine(event.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return fine
}

/**
 * Attaches the single pointermove listener that feeds `pointerX` / `pointerY`.
 *
 * `ready` flips once — on the first real pointer event. Until then there is no
 * honest answer to "where is the pointer", and drawing a cursor at a guessed
 * position is worse than drawing none: the first move would fling it across the
 * screen from wherever the guess was.
 */
export function usePointerPosition() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointerX.set(event.clientX)
      pointerY.set(event.clientY)
      if (!ready) setReady(true)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [ready])

  return { ready }
}
