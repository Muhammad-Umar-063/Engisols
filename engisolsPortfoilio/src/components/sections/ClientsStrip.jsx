import { clients } from '../../data/siteContent'
import { InfiniteSlider } from '../ui/InfiniteSlider'
import { ProgressiveBlur } from '../ui/ProgressiveBlur'
import { Sparkles } from '../ui/Sparkles'

export default function ClientsStrip() {
  return (
    <section className="clients-strip-v2">
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

        {/* Fade-out left edge */}
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

        {/* Fade-out right edge */}
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
      </div>

      {/* ── Sparkles / curved separator ── */}
      <div className="clients-sparkle-zone">
        {/* Crimson radial glow */}
        <div className="clients-sparkle-glow" />

        {/* Curved horizon line — same bg colour so it cuts the glow cleanly */}
        <div className="clients-sparkle-arc" />

        {/* Particle sparkles — sit above the arc (z-index: 2) */}
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
    </section>
  )
}
