/**
 * OpponentCrest — renders an opponent team logo from /public/*.png.
 *
 * Uses getOpponentLogo() to resolve the asset path. If no logo is found
 * (or the image fails to load), falls back to a neutral ShieldHalf icon.
 *
 * Visibility is controlled by React state (not direct DOM mutation) so
 * Supabase realtime re-renders never reset a failed image back to visible.
 */

import { useState } from 'react'
import { ShieldHalf } from 'lucide-react'
import { getOpponentLogo } from '../utils/opponentLogo'

interface Props {
  opponent: string
  /** Pixel size for both width and height. Default 52. */
  size?: number
  className?: string
}

export default function OpponentCrest({ opponent, size = 52, className = '' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  const logoPath    = getOpponentLogo(opponent)
  const showLogo    = !!logoPath && !imgFailed
  const radius      = Math.round(size * 0.27)   // ~14px at size=52

  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── Fallback: neutral shield — shown when no logo or image errors ── */}
      {!showLogo && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            borderRadius: radius,
            background:   'var(--bg-raised)',
            border:       '1.5px solid var(--border-input)',
          }}
        >
          <ShieldHalf
            size={Math.round(size * 0.5)}
            strokeWidth={1.5}
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      )}

      {/* ── Logo image — only mounted when a path resolves ─────────────── */}
      {logoPath && (
        <img
          src={logoPath}
          alt={opponent}
          className="absolute inset-0 object-contain"
          style={{
            width:        size,
            height:       size,
            borderRadius: radius,
            filter:       'drop-shadow(0 2px 6px rgba(0,0,0,0.30))',
            display:      showLogo ? 'block' : 'none',
          }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  )
}
