// LeBlanc shield + wordmark, same as leblancsols.com.
export default function Logo({ subtitle = 'SOLUTIONS', light = false }) {
  return (
    <div className="lockup" style={light ? { color: '#fff' } : undefined}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 4h24v13c0 6.2-4.6 10.3-12 13C8.6 27.3 4 23.2 4 17Z" fill="#16605E" />
        <path d="M4 9.5h24" stroke="#FFFFFF" strokeWidth="1.5" opacity=".5" />
        <circle cx="7.6" cy="6.8" r="1" fill="#FFFFFF" opacity=".6" />
        <circle cx="11" cy="6.8" r="1" fill="#FFFFFF" opacity=".6" />
        <path d="m10.5 16.6 4 4.2 8-8.4" fill="none" stroke="#FFFFFF" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <div className="t" style={light ? { color: '#fff' } : undefined}>LeBlanc</div>
        <div className="b" style={light ? { color: '#8CA2AD' } : undefined}>{subtitle}</div>
      </div>
    </div>
  )
}
