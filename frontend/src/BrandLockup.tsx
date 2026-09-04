export function BrandLockup() {
  return (
    <header className="brand-lockup">
      <h1 className="app-title">Calculator</h1>
      <div className="brand-desktop">
        <h1 aria-label="Let's do Mathematics.">
          <span className="brand-lead">Let's do</span>
          <span className="brand-mark">Mathematics.</span>
        </h1>
        <p className="brand-tagline">
          Do your thing
          <svg className="brand-arrow" viewBox="0 0 48 12" aria-hidden="true">
            <path
              d="M0 6h40M35 1.5 45.5 6 35 10.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </p>
      </div>
    </header>
  )
}
