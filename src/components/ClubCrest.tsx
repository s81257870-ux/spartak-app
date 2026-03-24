/**
 * ClubCrest — renders the Spartak Ciervo badge.
 *
 * Asset path: public/spartak-logo.png  →  served at /spartak-logo.png
 * To swap the logo: replace public/spartak-logo.png — no code change needed.
 *
 * Design:
 *   The PNG is a circular badge with transparent background.
 *   The fallback (navy "SC" circle) is hidden by default and only shown
 *   if the image fails to load — so no extra circle bleeds through the
 *   transparent PNG corners when the logo loads successfully.
 *
 *   A useRef (not useState) is used so HMR never causes a stale flag
 *   that blocks the real image from appearing.
 */

import { useRef } from 'react'

interface Props {
  /** Pixel size for both width and height. Default 48. */
  size?: number
  className?: string
}

export default function ClubCrest({ size = 48, className = '' }: Props) {
  const fallbackRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── Fallback: hidden by default, revealed only on image error ── */}
      <div
        ref={fallbackRef}
        className="absolute inset-0 rounded-full flex items-center justify-center select-none"
        style={{
          display:    'none',
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

      {/* ── Logo: full badge PNG, no external circular clip ─────────── */}
      <img
        src={`${import.meta.env.BASE_URL}spartak-logo.png`}
        alt="Spartak Ciervo"
        className="absolute inset-0 object-contain"
        style={{
          width:  size,
          height: size,
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          if (fallbackRef.current) fallbackRef.current.style.display = 'flex'
        }}
      />
    </div>
  )
}
