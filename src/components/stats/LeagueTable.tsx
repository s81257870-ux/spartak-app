import type { LeagueRow } from '../../data/leagueTable'

interface Props {
  rows: LeagueRow[]
  leagueName?: string
}

const PLAYOFF_CUT = 2

export default function LeagueTable({ rows, leagueName }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {leagueName && (
        <div className="px-4 pt-3.5 pb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] leading-tight"
             style={{ color: 'var(--text-muted)' }}>
            {leagueName}
          </p>
        </div>
      )}

      {/* Column headers */}
      <div
        className="grid items-center px-4 py-2"
        style={{
          gridTemplateColumns: '28px 1fr 32px 32px 32px 36px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>#</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Hold</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)' }}>K</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)' }}>V</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)' }}>T</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-faint)' }}>Pts</span>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row, index) => {
          const isSpartak   = !!row.isSpartak
          const showDivider = row.position === PLAYOFF_CUT

          return (
            <div key={row.team}>
              <div
                className="grid items-center px-4 py-3"
                style={{
                  gridTemplateColumns: '28px 1fr 32px 32px 32px 36px',
                  background: isSpartak ? 'rgba(249,115,22,0.06)' : undefined,
                  borderTop: index > 0 ? '1px solid var(--border-faint)' : undefined,
                }}
              >
                {/* Position */}
                <span className="text-[11px] font-bold tabular-nums"
                      style={{ color: isSpartak ? '#fb923c' : 'var(--text-faint)' }}>
                  {row.position}
                </span>

                {/* Team name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate"
                        style={{ color: isSpartak ? 'var(--text-primary)' : 'var(--text-secondary)',
                                 fontWeight: isSpartak ? 600 : 400 }}>
                    {row.team}
                  </span>
                  {isSpartak && (
                    <span className="shrink-0 text-[9px] font-bold text-orange-400/70 border border-orange-400/30 rounded px-1 py-0.5 leading-none">
                      OS
                    </span>
                  )}
                </div>

                {/* Played */}
                <span className="text-sm tabular-nums text-center" style={{ color: 'var(--text-muted)' }}>{row.played}</span>
                {/* Won */}
                <span className="text-sm tabular-nums text-center" style={{ color: 'var(--text-muted)' }}>{row.won}</span>
                {/* Lost */}
                <span className="text-sm tabular-nums text-center" style={{ color: 'var(--text-muted)' }}>{row.lost}</span>

                {/* Points */}
                <span
                  className={`text-sm font-bold tabular-nums text-center ${isSpartak ? 'text-orange-400' : ''}`}
                  style={isSpartak
                    ? { textShadow: '0 0 12px rgba(249,115,22,0.4)' }
                    : { color: 'var(--text-secondary)' }}
                >
                  {row.points}
                </span>
              </div>

              {showDivider && (
                <div className="mx-4 border-t border-dashed border-orange-500/30" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: '1px solid var(--border-faint)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t border-dashed border-orange-400/50" />
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Slutspil</span>
        </div>
      </div>
    </div>
  )
}
