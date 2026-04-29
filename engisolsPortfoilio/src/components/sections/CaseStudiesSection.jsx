import { Monitor, Smartphone, BarChart3, Brain, Zap } from 'lucide-react'
import { ExpandingCards } from '../ui/expanding-cards'
import { caseStudies } from '../../data/caseStudies'

const iconMap = {
  Monitor: <Monitor size={22} />,
  Smartphone: <Smartphone size={22} />,
  BarChart3: <BarChart3 size={22} />,
  Brain: <Brain size={22} />,
  Zap: <Zap size={22} />,
}

const cardItems = caseStudies.map((cs) => ({
  id: cs.slug,
  title: cs.title,
  category: cs.category,
  description: cs.shortDescription,
  imgSrc: cs.imgSrc,
  icon: iconMap[cs.iconName],
  href: `/case-studies/${cs.slug}`,
}))

export default function CaseStudiesSection() {
  return (
    <section id="case-studies">
      <div className="case-studies-header reveal" data-reveal>
        <div className="section-tag">Our Work</div>
        <h2 className="section-title">
          Built for Scale,
          <br />
          <span className="accent">Shipped with Precision</span>
        </h2>
        <p className="section-desc case-studies-desc">
          From concept to deployment — real projects engineered for performance, security, and growth.
          Hover a card to preview, click to explore the full story.
        </p>
      </div>

      <div className="reveal" data-reveal style={{ transitionDelay: '0.12s' }}>
        <ExpandingCards items={cardItems} defaultActiveIndex={0} />
      </div>
    </section>
  )
}
