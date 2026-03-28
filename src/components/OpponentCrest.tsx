/**
 * OpponentCrest — renders an opponent team logo from /public/*.png.
 *
 * Uses getOpponentLogo() to resolve the asset path. If no logo is found
 * (or the image fails to load), falls back to a neutral ShieldHalf icon
 * in the same rounded-rectangle container — same visual weight as ClubCrest.
 *
 * The fallback div is hidden initially (display:none) and only revealed
 * on image error, so no double-rendering bleeds through on success.
 */

import { useRef } from 'react'
import { ShieldHalf } from 'lucide-react'
import { getOpponentLogo } from '../utils/opponentLogo'

interface Props {
  opponent: string
  /** Pixel size for both width and height. Default 52. */
  size?: number
  className?: string
}

export default function OpponentCrest({ opponent, size = 52, className = '' }: Props) {
  const fallbackRef = useRef<HTMLDivElement>(null)
  const imgRef      = useRef<HTMLImageElement>(null)

  const logoPath = getOpponentLogo(opponent)
  const radius   = Math.round(size * 0.27)   // ~14px at size=52, scales proportionally

  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── Fallback container: neutral shield ─────────────────── */}
      <div
        ref={fallbackRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          display:      logoPath ? 'none' : 'flex',   // show immediately when no logo
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

      {/* ── Logo image — only mounted when a path exists ────────── */}
      {logoPath && (
        <img
          ref={imgRef}
          src={logoPath}
          alt={opponent}
          className="absolute inset-0 object-contain"
          style={{
            width:        size,
            height:       size,
            borderRadius: radius,
            filter:       'drop-shadow(0 2px 6px rgba(0,0,0,0.30))',
          }}
          onError={() => {
            if (imgRef.current)      imgRef.current.style.display = 'none'
            if (fallbackRef.current) fallbackRef.current.style.display = 'flex'
          }}
        />
      )}
    </div>
  )
}
