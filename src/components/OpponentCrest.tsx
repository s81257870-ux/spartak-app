/**
 * OpponentCrest — renders an opponent team logo from /public/*.png.
 *
 * Uses getOpponentLogo() to resolve the asset path. If no logo is found
 * (or the image fails to load), falls back to an initials avatar so there
 * is never an empty box rendered.
 */

import { useState } from 'react'
import { getOpponentLogo } from '../utils/opponentLogo'

interface Props {
  opponent: string
  /** Pixel size for both width and height. Default 52. */
  size?: number
  className?: string
}

export default function OpponentCrest({ opponent, size = 52, className = '' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  const logoPath = getOpponentLogo(opponent)
  const showLogo = !!logoPath && !imgFailed
  const radius   = Math.round(size * 0.27)   // ~14px at size=52

  // Initials: up to two words
  const initials = opponent
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (!showLogo) {
    return (
      <div
        className={`shrink-0 flex items-center justify-center select-none ${className}`}
        style={{
          width:        size,
          height:       size,
          borderRadius: radius,
          background:   'var(--bg-raised)',
          border:       '1.5px solid var(--border-input)',
          fontSize:     Math.round(size * 0.30),
          fontWeight:   700,
          color:        'var(--text-faint)',
          letterSpacing:'0.02em',
          flexShrink:   0,
        }}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logoPath}
        alt={opponent}
        className="absolute inset-0 object-contain"
        style={{
          width:        size,
          height:       size,
          borderRadius: radius,
          filter:       'drop-shadow(0 2px 6px rgba(0,0,0,0.30))',
        }}
        onError={() => setImgFailed(true)}
      />
    </div>
  )
}
