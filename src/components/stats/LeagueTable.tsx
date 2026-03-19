import type { LeagueRow } from '../../data/leagueTable'

interface Props {
  rows: LeagueRow[]
  leagueName?: string
}

/** Dashed separator drawn after this position (promotion playoff cutoff) */
const PLAYOFF_CUT = 2

export default function LeagueTable({ rows, leagueName }: Props) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: '#12131c' }}
    >
      {/* League name header */}
      {leagueName && (
        <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.12em] leading-tight">
            {leagueName}
          </p>
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid items-center px-4 py-2 border-b border-white/[0.06]"
        style={{ gridTemplateColumns: '28px 1fr 32px 32px 32px 36px' }}
      >
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">#</span>
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Hold</span>
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-center">K</span>
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-center">V</span>
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-center">T</span>
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-center">Pts</span>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row, index) => {
          const isSpartak = !!row.isSpartak
          const showDivider = row.position === PLAYOFF_CUT

          return (
            <div key={row.team}>
              <div
                className="grid items-center px-4 py-3"
                style={{
                  gridTemplateColumns: '28px 1fr 32px 32px 32px 36px',
                  background: isSpartak ? 'rgba(249,115,22,0.06)' : undefined,
                  borderTop: index > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                }}
              >
                {/* Position */}
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: isSpartak ? '#fb923c' : '#475569' }}
                >
                  {row.position}
                </span>

                {/* Team name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm truncate ${isSpartak ? 'text-white font-semibold' : 'text-slate-300'}`}>
                    {row.team}
                  </span>
                  {isSpartak && (
                    <span className="shrink-0 text-[9px] font-bold text-orange-400/70 border border-orange-400/30 rounded px-1 py-0.5 leading-none">
                      OS
                    </span>
                  )}
                </div>

                {/* Played */}
                <span className="text-sm text-slate-500 tabular-nums text-center">{row.played}</span>

                {/* Won */}
                <span className="text-sm text-slate-500 tabular-nums text-center">{row.won}</span>

                {/* Lost */}
                <span className="text-sm text-slate-500 tabular-nums text-center">{row.lost}</span>

                {/* Points */}
                <span
                  className={`text-sm font-bold tabular-nums text-center ${isSpartak ? 'text-orange-400' : 'text-slate-300'}`}
                  style={isSpartak ? { textShadow: '0 0 12px rgba(249,115,22,0.4)' } : {}}
                >
                  {row.points}
                </span>
              </div>

              {/* Dashed playoff cutoff line */}
              {showDivider && (
                <div className="mx-4 border-t border-dashed border-orange-500/30" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t border-dashed border-orange-400/50" />
          <span className="text-[10px] text-slate-600">Slutspil</span>
        </div>
      </div>
    </div>
  )
}
