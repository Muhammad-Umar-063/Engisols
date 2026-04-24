// ShinyButton — animated conic-gradient border button.
// All keyframe/property CSS lives in index.css (no styled-jsx needed in Vite).
export function ShinyButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) {
  return (
    <button
      type={type}
      className={`shiny-cta ${disabled ? 'shiny-cta--disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
    </button>
  )
}
