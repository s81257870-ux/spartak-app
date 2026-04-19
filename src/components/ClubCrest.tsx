/**
 * ClubCrest — renders the Spartak Ciervo badge.
 *
 * Asset path: public/spartak-logo.png  →  served at /spartak-logo.png
 * To swap the logo: replace public/spartak-logo.png — no code change needed.
 *
 * Long-press (600ms) opens the admin login modal so there is no visible
 * admin link in the UI for regular members. The long-press is on a wrapping
 * div so it doesn't interfere with normal tap/click handlers placed by parents.
 */

import { useRef, useState } from 'react'
import LoginModal from './auth/LoginModal'

interface Props {
  /** Pixel size for both width and height. Default 48. */
  size?: number
  className?: string
}

export default function ClubCrest({ size = 48, className = '' }: Props) {
  const fallbackRef  = useRef<HTMLDivElement>(null)
  const pressTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showLogin, setShowLogin] = useState(false)

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => setShowLogin(true), 600)
  }
  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size, userSelect: 'none' }}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
      >
        {/* ── Fallback: hidden by default, revealed only on image error ── */}
        <div
          ref={fallbackRef}
          className="absolute inset-0 rounded-full flex items-center justify-center select-none"
          style={{
            display:    'none',
            background: 'linear-gradient(135deg, #152035 0%, #1e3050 100%)',
            border:     '2px solid rgba(220,38,38,0.35)',
            boxShadow:  '0 0 10px rgba(220,38,38,0.12)',
          }}
        >
          <span
            style={{
              fontSize:      Math.round(size * 0.32),
              fontWeight:    900,
              letterSpacing: '0.04em',
              color:         '#DC2626',
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
          style={{ width: size, height: size }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (fallbackRef.current) fallbackRef.current.style.display = 'flex'
          }}
        />
      </div>
    </>
  )
}
