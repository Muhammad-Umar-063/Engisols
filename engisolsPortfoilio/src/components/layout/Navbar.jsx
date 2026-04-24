import { navLinks } from '../../data/siteContent'

export default function Navbar({ scrolled, mobileOpen, onToggle, onNavigate }) {
    return (
        <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
            <a href="#home" className="nav-logo" onClick={onNavigate} aria-label="ENGISOLS home">
                <img src="/engisols-logo-nav.svg" alt="ENGISOLS" width="120" height="28" />
            </a>

            <ul className={`nav-links ${mobileOpen ? 'open' : ''}`} id="navLinks">
                {navLinks.map((link) => (
                    <li key={link.href}>
                        <a href={link.href} onClick={onNavigate}>
                            {link.label}
                        </a>
                    </li>
                ))}
                <li>
                    <a href="#contact" className="nav-cta" onClick={onNavigate}>
                        Get a Quote
                    </a>
                </li>
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
