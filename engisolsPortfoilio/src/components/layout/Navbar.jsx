import { Link, useLocation } from 'react-router-dom'
import { navLinks } from '../../data/siteContent'

export default function Navbar({ scrolled, mobileOpen, onToggle, onNavigate }) {
    const { pathname } = useLocation()
    const isHome = pathname === '/'

    // On home, anchors stay as anchors (smooth in-page scroll).
    // On other routes, render a router Link to "/" + hash so we navigate home and the
    // HomePage useEffect handles the scroll-to-section.
    const renderNavItem = (href, label, className) => {
        if (isHome) {
            return (
                <a href={href} className={className} onClick={onNavigate}>
                    {label}
                </a>
            )
        }
        return (
            <Link to={`/${href}`} className={className} onClick={onNavigate}>
                {label}
            </Link>
        )
    }

    return (
        <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
            {isHome ? (
                <a href="#home" className="nav-logo" onClick={onNavigate} aria-label="ENGISOLS home">
                    <img src="/engisols-logo-nav.svg" alt="ENGISOLS" width="120" height="28" />
                </a>
            ) : (
                <Link to="/" className="nav-logo" onClick={onNavigate} aria-label="ENGISOLS home">
                    <img src="/engisols-logo-nav.svg" alt="ENGISOLS" width="120" height="28" />
                </Link>
            )}

            <ul className={`nav-links ${mobileOpen ? 'open' : ''}`} id="navLinks">
                {navLinks.map((link) => (
                    <li key={link.href}>{renderNavItem(link.href, link.label)}</li>
                ))}
                <li>{renderNavItem('#contact', 'Get a Quote', 'nav-cta')}</li>
            </ul>

            <button
                type="button"
                className="hamburger"
                id="hamburger"
                onClick={onToggle}
                aria-expanded={mobileOpen}
                aria-label="Toggle navigation"
            >
                <span />
                <span />
                <span />
            </button>
        </nav>
    )
}
