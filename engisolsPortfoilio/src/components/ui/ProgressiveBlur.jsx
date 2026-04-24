// ProgressiveBlur — progressive backdropFilter blur using a layered mask technique.
// Uses framer-motion instead of the motion/react package to stay dependency-consistent.
import { motion } from 'framer-motion'

const GRADIENT_ANGLES = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
}

export function ProgressiveBlur({
  direction = 'bottom',
  blurLayers = 8,
  className = '',
  blurIntensity = 0.25,
  style = {},
}) {
  const layers = Math.max(blurLayers, 2)
  const segmentSize = 1 / (blurLayers + 1)
  const angle = GRADIENT_ANGLES[direction]

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {Array.from({ length: layers }).map((_, index) => {
        const stops = [
          index * segmentSize,
          (index + 1) * segmentSize,
          (index + 2) * segmentSize,
          (index + 3) * segmentSize,
        ]
          .map(
            (pos, pi) =>
              `rgba(255,255,255,${pi === 1 || pi === 2 ? 1 : 0}) ${pos * 100}%`,
          )
          .join(', ')

        const mask = `linear-gradient(${angle}deg, ${stops})`

        return (
          <motion.div
            key={index}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              maskImage: mask,
              WebkitMaskImage: mask,
              backdropFilter: `blur(${index * blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${index * blurIntensity}px)`,
            }}
          />
        )
      })}
    </div>
  )
}
