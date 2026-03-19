import type { Match } from '../../types'

interface Props {
  match: Match
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })

export default function LastMatchCard({ match }: Props) {
  const won  = match.scoreUs > match.scoreThem
  const draw = match.scoreUs === match.scoreThem

  const resultColor = won ? '#4ade80' : draw ? '#facc15' : '#f87171'
  const resultLabel = won ? 'Sejr'    : draw ? 'Uafgjort' : 'Nederlag'

  return (
    <div
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: '#12131c' }}
    >
      {/* Top accent strip */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${resultColor}60 0%, ${resultColor}20 100%)`,
        }}
      />

      <div className="px-4 py-4">
        {/* Label row */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.12em]">
            Seneste kamp
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">{formatDate(match.date)}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                color: resultColor,
                background: `${resultColor}18`,
                borderColor: `${resultColor}40`,
              }}
            >
              {resultLabel}
            </span>
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center justify-between">
          {/* Spartak */}
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">Spartak Ciervo</p>
            <p className="text-slate-600 text-[10px]">Hjemme</p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-4">
            <span
              className="text-4xl font-black tabular-nums"
              style={{ color: won ? '#4ade80' : 'white' }}
            >
              {match.scoreUs}
            </span>
            <span className="text-slate-700 text-xl font-bold">–</span>
            <span className="text-4xl font-black text-white tabular-nums">
              {match.scoreThem}
            </span>
          </div>

          {/* Opponent */}
          <div className="flex-1 text-right">
            <p className="text-white font-bold text-sm leading-tight">{match.opponent}</p>
            <p className="text-slate-600 text-[10px]">{match.location}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
