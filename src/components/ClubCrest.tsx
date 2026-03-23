/**
 * ClubCrest — renders the Spartak Ciervo badge.
 *
 * Asset path: public/spartak-logo.png  →  served at  /spartak-logo.png
 * To swap the logo: replace public/spartak-logo.png — no code change needed.
 *
 * Design:
 *   The fallback (navy "SC" circle) is always rendered as the base layer.
 *   The <img> is stacked on top via absolute positioning.
 *   • If the image loads  → it covers the fallback (visible).
 *   • If the image errors → it is hidden via onError, fallback shows through.
 *
 * This avoids React state entirely, so HMR / Fast Refresh never causes
 * a stale "failed" flag to block the real image from appearing.
 */

interface Props {
  /** Pixel size for both width and height. Default 48. */
  size?: number
  className?: string
}

export default function ClubCrest({ size = 48, className = '' }: Props) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── Fallback: always rendered underneath ──────────────────── */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center select-none"
        style={{
          background: 'linear-gradient(135deg, #152035 0%, #1e3050 100%)',
          border:     '2px solid rgba(149,197,233,0.35)',
          boxShadow:  '0 0 10px rgba(149,197,233,0.12)',
        }}
      >
        <span
          style={{
            fontSize:      Math.round(size * 0.32),
            fontWeight:    900,
            letterSpacing: '0.04em',
            color:         '#95C5E9',
            lineHeight:    1,
          }}
        >
          SC
        </span>
      </div>

      {/* ── Logo: covers fallback when it loads successfully ──────── */}
      <img
        src="/spartak-logo.png"
        alt="Spartak Ciervo"
        className="absolute inset-0 object-contain"
        style={{
          width:        size,
          height:       size,
          borderRadius: '50%',
          filter:       'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
        }}
        onError={(e) => {
          // Hide the broken img so the fallback layer shows through.
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}
