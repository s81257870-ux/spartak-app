/**
 * ClubCrest — renders the Spartak Ciervo badge.
 *
 * Asset: drop your logo PNG at   public/spartak-logo.png
 * (root-relative path, no import needed — just copy the file there)
 *
 * If the file is missing or fails to load, a navy/light-blue "SC"
 * monogram fallback is shown automatically.
 *
 * To swap the logo later: replace public/spartak-logo.png — done.
 */

import { useState } from 'react'

interface Props {
  /** Pixel size for both width and height. Default 48. */
  size?: number
  className?: string
}

export default function ClubCrest({ size = 48, className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`rounded-full flex items-center justify-center shrink-0 select-none ${className}`}
        style={{
          width:  size,
          height: size,
          background: 'linear-gradient(135deg, #152035 0%, #1e3050 100%)',
          border: '2px solid rgba(149,197,233,0.35)',
          boxShadow: '0 0 10px rgba(149,197,233,0.12)',
        }}
      >
        <span
          style={{
            fontSize:   Math.round(size * 0.32),
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: '#95C5E9',
            lineHeight: 1,
          }}
        >
          SC
        </span>
      </div>
    )
  }

  return (
    <img
      src="/spartak-logo.png"
      alt="Spartak Ciervo"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`object-contain shrink-0 ${className}`}
      style={{
        width:        size,
        height:       size,
        borderRadius: '50%',
        /* subtle drop shadow so the badge reads on any bg */
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
      }}
    />
  )
}
