import { useEffect, useState } from 'react'
import { clients } from '../../data/siteContent'
import { InfiniteSlider } from '../ui/InfiniteSlider'
import { ProgressiveBlur } from '../ui/ProgressiveBlur'
import { Sparkles } from '../ui/Sparkles'

// Phones (≤640px) skip the edge-blur + sparkles entirely:
//   • Saves the tsparticles canvas animation loop (battery)
//   • Saves backdrop-filter rendering (which is expensive on low-end GPUs)
//   • Tablets (641px+) still get the full effect.
const MOBILE_BREAKPOINT = '(max-width: 640px)'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT)
    const update = (e) => setIsMobile(e.matches)
    update(mq)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}

export default function ClientsStrip() {
  const isMobile = useIsMobile()

  return (
    <section className="clients-strip-v2">
      <div className="clients-strip-container">
        {/* ── Label ── */}
        <p className="clients-label">Trusted by Companies Worldwide</p>

        {/* ── Infinite slider row with progressive edge-blur ── */}
        <div className="clients-slider-row">
          <InfiniteSlider
            duration={30}
            gap={56}
            durationOnHover={60}
            style={{ display: 'flex', alignItems: 'center', height: '100%' }}
          >
            {clients.map((name) => (
              <span key={name} className="client-name">
                {name}
              </span>
            ))}
          </InfiniteSlider>

          {/* Edge blurs — desktop + tablet only */}
          {!isMobile && (
            <>
              <ProgressiveBlur
                direction="left"
                blurIntensity={0.9}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '180px',
                  pointerEvents: 'none',
                }}
              />

              <ProgressiveBlur
                direction="right"
                blurIntensity={0.9}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: '180px',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>

        {/* ── Sparkles / curved separator (desktop + tablet only) ── */}
        {!isMobile && (
          <div className="clients-sparkle-zone">
            <div className="clients-sparkle-glow" />
            <div className="clients-sparkle-arc" />
            <Sparkles
              density={1100}
              color="#ff6b8a"
              speed={0.8}
              opacity={0.75}
              minOpacity={0.25}
              size={1.6}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                maskImage:
                  'radial-gradient(55% 55% at 50% 100%, white, transparent)',
                WebkitMaskImage:
                  'radial-gradient(55% 55% at 50% 100%, white, transparent)',
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
