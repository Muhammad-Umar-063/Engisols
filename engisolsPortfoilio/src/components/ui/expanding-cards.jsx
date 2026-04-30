import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export function ExpandingCards({ items, defaultActiveIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const gridStyle = useMemo(() => {
    if (isDesktop) {
      const columns = items.map((_, i) => (i === activeIndex ? '5fr' : '1fr')).join(' ')
      return { gridTemplateColumns: columns }
    } else {
      const rows = items.map((_, i) => (i === activeIndex ? '5fr' : '1fr')).join(' ')
      return { gridTemplateRows: rows }
    }
  }, [activeIndex, items.length, isDesktop])

  return (
    <ul
      className="ec-list"
      style={{
        ...gridStyle,
        ...(isDesktop ? { gridTemplateRows: '1fr' } : { gridTemplateColumns: '1fr' }),
      }}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className="ec-item"
          data-active={activeIndex === index}
          onMouseEnter={() => setActiveIndex(index)}
          onFocus={() => setActiveIndex(index)}
        >
          <Link
            to={item.href}
            className="ec-link"
            aria-label={`Read case study: ${item.title}`}
            onClick={() => setActiveIndex(index)}
          >
            <img
              src={item.imgSrc}
              alt={`${item.title} — ENGISOLS ${item.category} case study`}
              className="ec-img"
              loading="lazy"
              decoding="async"
              width="600"
              height="400"
            />
            <div className="ec-overlay" />
            <div className="ec-content">
              <span className="ec-sideways-title">{item.title}</span>
              <span className="ec-tag">{item.category}</span>
              <div className="ec-icon">{item.icon}</div>
              <h3 className="ec-title">{item.title}</h3>
              <p className="ec-desc">{item.description}</p>
              <span className="ec-read-more">
                Read Case Study
                <ArrowUpRight size={16} strokeWidth={2.2} />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
