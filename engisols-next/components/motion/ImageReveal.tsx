'use client'

import { m } from 'motion/react'
import { useMotionPrefs } from '@/hooks/useMotionPrefs'
import { EASE } from '@/lib/motion'

/**
 * Team portrait reveal — animation spec section 11.1.
 *
 * A mask wipes upward while the image inside scales 1.14 → 1 on a LONGER
 * duration (0.9s vs the clip's 0.7s), so the photo is still settling as the
 * mask finishes — that overlap is what makes it feel considered rather than
 * mechanical. Portraits stagger by 90ms.
 *
 * clip-path + transform only: both compositor-friendly, neither reflows, and
 * the image is merely clipped, never absent — it stays in the HTML for
 * crawlers regardless.
 *
 * Reduced motion: opacity fade only, no clip, no scale.
 */
export function ImageReveal({
  src,
  alt,
  index = 0,
  className,
}: {
  src: string
  alt: string
  index?: number
  className?: string
}) {
  const { mounted, reduced } = useMotionPrefs()
  const delay = index * 0.09

  if (reduced) {
    return (
      <m.div
        className={className}
        initial={mounted ? { opacity: 0 } : false}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.36, ease: EASE.enter, delay }}
      >
        <img src={src} alt={alt} className="block h-full w-full object-cover" />
      </m.div>
    )
  }

  return (
    <m.div
      className={`overflow-hidden ${className ?? ''}`}
      initial={mounted ? { clipPath: 'inset(0 0 100% 0)' } : false}
      whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: EASE.enter, delay }}
    >
      <m.img
        src={src}
        alt={alt}
        className="block h-full w-full object-cover"
        initial={mounted ? { scale: 1.14 } : false}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.9, ease: EASE.enter, delay }}
      />
    </m.div>
  )
}
