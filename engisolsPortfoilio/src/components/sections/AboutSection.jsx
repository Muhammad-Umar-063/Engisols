import RadialOrbitalTimeline from '../ui/RadialOrbitalTimeline'
import { Zap, Shield, Eye, Users, Lightbulb, TrendingUp } from 'lucide-react'

const aboutOrbitData = [
  {
    id: 1,
    title: 'Speed',
    date: '5+ Years',
    content: 'Fast delivery without compromising on quality or engineering standards.',
    category: 'Value',
    icon: Zap,
    relatedIds: [2, 6],
    status: 'completed',
    energy: 95,
  },
  {
    id: 2,
    title: 'Reliability',
    date: '98% Uptime',
    content: 'Battle-tested architectures with proven uptime and security built in from day one.',
    category: 'Value',
    icon: Shield,
    relatedIds: [1, 3],
    status: 'completed',
    energy: 98,
  },
  {
    id: 3,
    title: 'Transparency',
    date: '120+ Projects',
    content: 'Full project visibility, clear milestones, and honest communication throughout.',
    category: 'Value',
    icon: Eye,
    relatedIds: [2, 4],
    status: 'completed',
    energy: 90,
  },
  {
    id: 4,
    title: 'Partnership',
    date: '98% Retention',
    content: 'We don\'t just deliver — we become an extension of your team.',
    category: 'Value',
    icon: Users,
    relatedIds: [3, 5],
    status: 'completed',
    energy: 88,
  },
  {
    id: 5,
    title: 'Innovation',
    date: 'Cutting-edge',
    content: 'Cutting-edge solutions using the latest technologies and methodologies.',
    category: 'Value',
    icon: Lightbulb,
    relatedIds: [4, 6],
    status: 'completed',
    energy: 92,
  },
  {
    id: 6,
    title: 'Scalability',
    date: 'Grow Fast',
    content: 'Systems built to grow with your business, handling scale from launch to enterprise.',
    category: 'Value',
    icon: TrendingUp,
    relatedIds: [5, 1],
    status: 'completed',
    energy: 87,
  },
]

export default function AboutSection() {
  return (
    <section id="about">

      {/* ── Left: Orbital visualisation ── */}
      <div className="about-orbital-wrap reveal" data-reveal>
        <RadialOrbitalTimeline timelineData={aboutOrbitData} />
      </div>

      {/* ── Right: Text content ── */}
      <div className="about-text reveal" style={{ transitionDelay: '0.1s' }} data-reveal>
        <div className="section-tag">About ENGISOLS</div>
        <h2 className="section-title">
          Engineering Solutions<br />
          That <span className="accent">Scale With You</span>
        </h2>
        <p className="section-desc">
          EngiSols is a modern software development company built for a world that never slows down.
          We design and engineer intelligent digital solutions that power growth, scale ideas,
          and solve real-world problems with precision.
        </p>

        <div className="about-hint">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#dd3e5e" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
          Click any node to explore our core values
        </div>
      </div>
    </section>
  )
}
