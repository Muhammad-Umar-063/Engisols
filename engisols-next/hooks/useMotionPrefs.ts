'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

/**
 * The one hook every scene gates on — animation spec section 1.3.
 *
 * - `reduced` collapses every scroll scene to a plain opacity fade at final
 *   position. Never a disable, never a jump.
 * - `allowPointerFX === false` means the custom cursor, the cursor image hover
 *   and the collision grid all render as static, fully usable versions.
 * - `mounted === false` means server render — see the mount gate (spec 1.4).
 */
export function useMotionPrefs() {
  const reduced = useReducedMotion()
  const [finePointer, setFinePointer] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // The canonical mount gate (animation spec 1.3/1.4): flipping this state in
    // an effect is the point — it is what separates the server render from the
    // hydrated one. The lint rule is right in general and wrong here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const mq = window.matchMedia('(pointer: fine)')
    setFinePointer(mq.matches)
    const on = (e: MediaQueryListEvent) => setFinePointer(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return {
    mounted,
    reduced: !!reduced,
    finePointer,
    allowPointerFX: mounted && finePointer && !reduced,
  }
}
