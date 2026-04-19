import type { Position } from '../../types'
import { POSITION_LABELS } from '../../types'

// Categorical palette — amber/blue/violet/yellow.
// These colors do NOT appear as status signals elsewhere in the app,
// so they safely identify position group without implying outcome.
const POSITION_GROUPS: Record<Position, { bg: string; color: string; border: string }> = {
  // Goalkeeper — yellow
  MV:  { bg: 'rgba(250,204,21,0.12)',  color: '#facc15', border: 'rgba(250,204,21,0.30)'  },

  // Defenders — violet
  VB:  { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
  CB:  { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
  HB:  { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
  VCB: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
  HCB: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },

  // Midfielders — blue
  VM:  { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },
  CM:  { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },
  HM:  { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },
  VCM: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },
  HCM: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },
  CMD: { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.28)'  },

  // Attackers — amber
  VA:  { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', border: 'rgba(251,146,60,0.28)'  },
  A:   { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', border: 'rgba(251,146,60,0.28)'  },
  HA:  { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', border: 'rgba(251,146,60,0.28)'  },
  SS:  { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', border: 'rgba(251,146,60,0.28)'  },

  // Unknown — neutral
  UKE: { bg: 'rgba(160,160,160,0.10)', color: '#a0a0a0', border: 'rgba(160,160,160,0.20)' },
}

interface Props {
  position: Position
  short?: boolean
}

export default function PositionBadge({ position, short = false }: Props) {
  const { bg, color, border } = POSITION_GROUPS[position]
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {short ? position : POSITION_LABELS[position]}
    </span>
  )
}
