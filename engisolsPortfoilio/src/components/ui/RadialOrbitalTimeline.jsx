import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowRight, Zap } from 'lucide-react'

const CRIMSON = '#dd3e5e'
const SURFACE = 'rgba(26, 26, 26, 0.97)'
const BORDER = 'rgba(221, 62, 94, 0.22)'
const BORDER_DIM = 'rgba(255, 255, 255, 0.07)'
const TEXT_PRI = '#f0f0f0'
const TEXT_SEC = '#9a9a9a'
const TEXT_MUT = '#5a5a5a'
const RADIUS = 185
const ROTATION_STEP = 0.35
const SPEED_SMOOTHING = 0.08
const NODE_LEAVE_DELAY = 90

function StatusBadge({ status }) {
  const map = {
    completed: { background: CRIMSON, color: '#fff', border: `1px solid ${CRIMSON}` },
    'in-progress': { background: 'rgba(221,62,94,0.15)', color: CRIMSON, border: `1px solid ${CRIMSON}` },
    pending: { background: 'transparent', color: TEXT_SEC, border: `1px solid ${BORDER_DIM}` },
  }
  const labels = { completed: 'COMPLETE', 'in-progress': 'IN PROGRESS', pending: 'PENDING' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '20px', fontSize: '0.65rem',
      fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif",
      letterSpacing: '0.1em', ...map[status],
    }}>
      {labels[status]}
    </span>
  )
}

export default function RadialOrbitalTimeline({ timelineData }) {
  /* ── Only these cause re-renders — infrequent interactions ── */
  const [expandedItems, setExpandedItems] = useState({})
  const [activeNodeId, setActiveNodeId] = useState(null)
  const [pulseEffect, setPulseEffect] = useState({})
  const [cardAboveById, setCardAboveById] = useState({})

  /* ── Rotation lives in a ref — never triggers re-renders ── */
  const rotAngle = useRef(0)
  const currentSpeed = useRef(ROTATION_STEP)
  const targetSpeed = useRef(ROTATION_STEP)
  const rafRef = useRef(null)
  const leaveTimerRef = useRef(null)
  const nodeRefs = useRef({})   // wrapper divs for each orbit node
  const containerRef = useRef(null)

  /* ── rAF loop: update DOM directly, zero React re-renders ── */
  useEffect(() => {
    const total = timelineData.length

    const tick = () => {
      const speedDelta = targetSpeed.current - currentSpeed.current
      currentSpeed.current += speedDelta * SPEED_SMOOTHING
      if (Math.abs(speedDelta) < 0.0001) {
        currentSpeed.current = targetSpeed.current
      }

      rotAngle.current = (rotAngle.current + currentSpeed.current + 360) % 360

      for (let i = 0; i < total; i++) {
        const item = timelineData[i]
        const el = nodeRefs.current[item.id]
        if (!el) continue

        const angle = ((i / total) * 360 + rotAngle.current) % 360
        const rad = (angle * Math.PI) / 180
        const x = RADIUS * Math.cos(rad)
        const y = RADIUS * Math.sin(rad)
        const op = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(rad)) / 2)))

        el.style.transform = `translate(${x}px, ${y}px)`
        /* only update opacity when not expanded */
        if (!expandedItems[item.id]) el.style.opacity = op
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (leaveTimerRef.current) {
        window.clearTimeout(leaveTimerRef.current)
      }
    }
  }, [timelineData, expandedItems])

  /* ── Helpers ── */
  const getRelated = useCallback((id) => {
    const item = timelineData.find(i => i.id === id)
    return item ? item.relatedIds : []
  }, [timelineData])

  const isRelated = useCallback((id) => {
    if (!activeNodeId) return false
    return getRelated(activeNodeId).includes(id)
  }, [activeNodeId, getRelated])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const stopRotation = useCallback(() => {
    targetSpeed.current = 0
  }, [])

  const resumeRotation = useCallback(() => {
    targetSpeed.current = ROTATION_STEP
  }, [])

  const resetOrbit = useCallback(() => {
    clearLeaveTimer()
    setExpandedItems({})
    setActiveNodeId(null)
    setPulseEffect({})
    setCardAboveById({})
    resumeRotation()
  }, [clearLeaveTimer, resumeRotation])

  const openItem = useCallback((id, { snapToNode = false } = {}) => {
    clearLeaveTimer()

    const next = {}
    timelineData.forEach((item) => {
      next[item.id] = item.id === id
    })

    setExpandedItems(next)
    setActiveNodeId(id)
    stopRotation()

    if (snapToNode) {
      const idx = timelineData.findIndex(i => i.id === id)
      rotAngle.current = (270 - (idx / timelineData.length) * 360 + 360) % 360
    }

    const pulse = {}
    getRelated(id).forEach(rid => { pulse[rid] = true })
    setPulseEffect(pulse)

    const nodeEl = nodeRefs.current[id]
    const containerEl = containerRef.current
    if (nodeEl && containerEl) {
      const nodeRect = nodeEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      const nodeCenterY = nodeRect.top - containerRect.top + nodeRect.height / 2
      const showAbove = nodeCenterY > containerRect.height * 0.55
      setCardAboveById({ [id]: showAbove })
    } else {
      setCardAboveById({ [id]: false })
    }
  }, [timelineData, getRelated, clearLeaveTimer, stopRotation])

  /* ── Toggle node ── */
  const toggleItem = useCallback((id) => {
    if (expandedItems[id]) {
      resetOrbit()
      return
    }
    openItem(id, { snapToNode: true })
  }, [expandedItems, openItem, resetOrbit])

  const handleNodeHover = useCallback((id) => {
    if (activeNodeId === id && expandedItems[id]) {
      clearLeaveTimer()
      stopRotation()
      return
    }
    openItem(id, { snapToNode: false })
  }, [activeNodeId, expandedItems, openItem, clearLeaveTimer, stopRotation])

  const handleNodeLeave = useCallback(() => {
    clearLeaveTimer()
    leaveTimerRef.current = window.setTimeout(() => {
      leaveTimerRef.current = null
      setExpandedItems({})
      setActiveNodeId(null)
      setPulseEffect({})
      setCardAboveById({})
      resumeRotation()
    }, NODE_LEAVE_DELAY)
  }, [clearLeaveTimer, resumeRotation])

  const handleContainerClick = (e) => {
    if (e.target === containerRef.current) {
      resetOrbit()
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onMouseLeave={resetOrbit}
      style={{
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      {/* Orbit rings */}
      <div style={{
        position: 'absolute', width: '370px', height: '370px',
        borderRadius: '50%', border: '1px dashed rgba(221,62,94,0.18)',
        pointerEvents: 'none', willChange: 'transform',
      }} />
      <div style={{
        position: 'absolute', width: '420px', height: '420px',
        borderRadius: '50%', border: '1px dashed rgba(221,62,94,0.07)',
        pointerEvents: 'none',
      }} />

      {/* Center logo */}
      <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <div className="about-orbital-ping" style={{
          position: 'absolute', inset: '-20px', borderRadius: '50%',
          border: '1px solid rgba(221,62,94,0.35)',
        }} />
        <div className="about-orbital-ping about-orbital-ping-delay" style={{
          position: 'absolute', inset: '-32px', borderRadius: '50%',
          border: '1px solid rgba(221,62,94,0.18)',
        }} />
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--surface-elevated)',
          border: '1px solid rgba(221,62,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(221,62,94,0.18), 0 0 0 8px rgba(221,62,94,0.05)',
        }}>
          <img src="/engisols-mark.svg" alt="ENGISOLS brand mark" width="40" height="40"
            loading="lazy" decoding="async"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Orbit nodes — positioned by rAF loop */}
      {timelineData.map((item) => {
        const expanded = !!expandedItems[item.id]
        const related = isRelated(item.id)
        const pulsing = !!pulseEffect[item.id]
        const Icon = item.icon
        const showCardAbove = !!cardAboveById[item.id]

        const nodeBg = expanded ? CRIMSON : related ? 'rgba(221,62,94,0.25)' : 'var(--surface-elevated)'
        const nodeBorder = expanded || related ? CRIMSON : 'rgba(255,255,255,0.15)'
        const nodeColor = expanded ? '#fff' : related ? CRIMSON : TEXT_SEC

        return (
          <div
            key={item.id}
            ref={el => (nodeRefs.current[item.id] = el)}
            onMouseEnter={() => handleNodeHover(item.id)}
            onMouseLeave={handleNodeLeave}
            onClick={e => { e.stopPropagation(); toggleItem(item.id) }}
            style={{
              position: 'absolute',
              /* initial off-screen until rAF positions them */
              transform: 'translate(-9999px,-9999px)',
              zIndex: expanded ? 200 : 5,
              opacity: expanded ? 1 : 0.6,
              cursor: 'pointer',
              willChange: 'transform',
            }}
          >
            {/* Energy glow */}
            <div style={{
              position: 'absolute',
              width: `${item.energy * 0.45 + 36}px`,
              height: `${item.energy * 0.45 + 36}px`,
              left: `-${(item.energy * 0.45) / 2}px`,
              top: `-${(item.energy * 0.45) / 2}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(221,62,94,0.18) 0%, transparent 70%)',
              animation: pulsing ? 'about-pulse 1.2s ease-in-out infinite' : 'none',
              pointerEvents: 'none',
              willChange: 'opacity, transform',
            }} />

            {/* Icon button */}
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: nodeBg,
              border: `2px solid ${nodeBorder}`,
              boxShadow: expanded ? '0 0 16px rgba(221,62,94,0.4)' : 'none',
              transform: expanded ? 'scale(1.4)' : 'scale(1)',
              transition: 'background 0.3s, border-color 0.3s, transform 0.3s, box-shadow 0.3s',
              color: nodeColor,
              willChange: 'transform',
            }}>
              <Icon size={15} />
            </div>

            {/* Label */}
            <div style={{
              position: 'absolute', top: '46px', left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap', fontSize: '0.68rem', fontWeight: 600,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: '0.06em',
              color: expanded ? TEXT_PRI : 'rgba(240,240,240,0.6)',
              transition: 'color 0.3s',
              pointerEvents: 'none',
            }}>
              {item.title}
            </div>

            {/* Popup card */}
            {expanded && (
              <div style={{
                position: 'absolute', left: '50%',
                transform: 'translateX(-50%)',
                width: '230px',
                background: SURFACE,
                border: `0.5px solid ${BORDER}`,
                borderRadius: '14px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 24px rgba(221,62,94,0.1)',
                zIndex: 300,
                ...(showCardAbove ? { bottom: '58px' } : { top: '62px' }),
              }}>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '1px',
                  height: '10px',
                  background: 'rgba(221,62,94,0.4)',
                  ...(showCardAbove ? { bottom: '-10px' } : { top: '-10px' }),
                }} />

                <div style={{ padding: '14px 16px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <StatusBadge status={item.status} />
                    <span style={{ fontSize: '0.65rem', color: TEXT_MUT, fontFamily: 'monospace' }}>{item.date}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT_PRI, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {item.title}
                  </div>
                </div>

                <div style={{ padding: '0 16px 14px' }}>
                  <p style={{ fontSize: '0.75rem', color: TEXT_SEC, lineHeight: 1.6, fontWeight: 300 }}>
                    {item.content}
                  </p>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `0.5px solid ${BORDER_DIM}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.65rem', color: TEXT_MUT, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={9} color={CRIMSON} /> Strength
                      </span>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: CRIMSON }}>{item.energy}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.energy}%`, background: `linear-gradient(90deg, ${CRIMSON}, #643232)`, borderRadius: '4px' }} />
                    </div>
                  </div>

                  {item.relatedIds.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `0.5px solid ${BORDER_DIM}` }}>
                      <div style={{ fontSize: '0.62rem', color: TEXT_MUT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '7px' }}>Connected</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {item.relatedIds.map(rid => {
                          const rel = timelineData.find(i => i.id === rid)
                          return (
                            <button key={rid}
                              onClick={e => { e.stopPropagation(); toggleItem(rid) }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', borderRadius: '6px',
                                background: 'transparent', border: '0.5px solid rgba(221,62,94,0.3)',
                                color: TEXT_SEC, fontSize: '0.68rem', cursor: 'pointer',
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                                transition: 'border-color 0.2s, color 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = CRIMSON; e.currentTarget.style.color = TEXT_PRI }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(221,62,94,0.3)'; e.currentTarget.style.color = TEXT_SEC }}
                            >
                              {rel?.title}<ArrowRight size={8} />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
