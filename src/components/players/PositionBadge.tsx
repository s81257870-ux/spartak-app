import type { Position } from '../../types'
import { POSITION_LABELS } from '../../types'

const colors: Record<Position, string> = {
  MV:  'bg-yellow-900/60 text-yellow-300',
  VB:  'bg-blue-900/60 text-blue-300',
  CB:  'bg-blue-900/60 text-blue-300',
  HB:  'bg-blue-900/60 text-blue-300',
  VCB: 'bg-blue-900/60 text-blue-300',
  HCB: 'bg-blue-900/60 text-blue-300',
  VM:  'bg-green-900/60 text-green-300',
  CM:  'bg-green-900/60 text-green-300',
  HM:  'bg-green-900/60 text-green-300',
  VCM: 'bg-green-900/60 text-green-300',
  HCM: 'bg-green-900/60 text-green-300',
  CMD: 'bg-green-900/60 text-green-300',
  VA:  'bg-red-900/60 text-red-300',
  A:   'bg-red-900/60 text-red-300',
  HA:  'bg-red-900/60 text-red-300',
  SS:  'bg-red-900/60 text-red-300',
  UKE: 'bg-slate-700 text-slate-300',
}

interface Props {
  position: Position
  short?: boolean
}

export default function PositionBadge({ position, short = false }: Props) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[position]}`}>
      {short ? position : POSITION_LABELS[position]}
    </span>
  )
}
