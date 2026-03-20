/**
 * NextMatchLineup — display-only pitch + bench preview for the Home page.
 *
 * Derives all data from props:
 *   - formation : match.formation → getFormation()
 *   - starters  : Object.values(match.lineup) ∩ match.attendance
 *   - bench     : match.attendance − starters
 *
 * No drag-and-drop, no editing, no admin controls.
 */

import type { Match, Player, Position } from '../../types'
import { getFormation } from '../../data/formations'
import { chipLabel } from '../../utils/playerName'

interface Props {
  match: Match
  allPlayers: Player[]
}

export default function NextMatchLineup({ match, allPlayers }: Props) {
  const formation     = getFormation(match.formation)
  const attendanceIds = new Set(match.attendance ?? [])

  // Starters: lineup slots whose player is still in attendance (guard stale IDs)
  const starterIds = new Set(
    Object.values(match.lineup).filter((pid) => attendanceIds.has(pid))
  )

  // Bench: attendance players not placed on the pitch
  const benchPlayers = allPlayers.filter(
    (p) => attendanceIds.has(p.id) && !starterIds.has(p.id)
  )

  const getPlayerInSlot = (pos: Position): Player | undefined => {
    const pid = match.lineup[pos]
    if (!pid || !attendanceIds.has(pid)) return undefined
    return allPlayers.find((p) => p.id === pid)
  }

  const maxRow  = Math.max(...formation.slots.map((s) => s.row))
  const pitchH  = maxRow * 60   // compact: 60px per row (editor uses 68px)

  return (
    <>
      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }} />

      {/* ── Section header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Opstilling
        </p>
        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
          · {formation.name}
        </span>
        <span
          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.30)', color: 'rgba(255,255,255,0.55)' }}
        >
          {starterIds.size}/7
        </span>
      </div>

      {/* ── Pitch ──────────────────────────────────────────────────── */}
      <div
        className="relative rounded-xl overflow-hidden w-full mb-2.5"
        style={{
          height: `${pitchH}px`,
          background: 'linear-gradient(180deg, #1e4a2e 0%, #16361f 40%, #16361f 60%, #1e4a2e 100%)',
        }}
      >
        {/* Pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 280 ${pitchH}`}
          preserveAspectRatio="none"
        >
          {/* Outer border */}
          <rect
            x="6" y="6" width="268" height={pitchH - 12} rx="3"
            fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"
          />
          {/* Centre line */}
          <line
            x1="6" y1={pitchH / 2} x2="274" y2={pitchH / 2}
            stroke="white" strokeOpacity="0.10" strokeWidth="1"
          />
          {/* Alternating row shading */}
          {Array.from({ length: maxRow }, (_, i) => (
            <rect
              key={i}
              x="6"
              y={6 + i * ((pitchH - 12) / maxRow)}
              width="268"
              height={(pitchH - 12) / maxRow}
              fill="white"
              fillOpacity={i % 2 === 0 ? 0.03 : 0}
            />
          ))}
        </svg>

        {/* Player grid */}
        <div
          className="absolute inset-0"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${maxRow}, 1fr)`,
            gridTemplateColumns: 'repeat(3, 1fr)',
            padding: '6px',
          }}
        >
          {formation.slots.map(({ key, row, col }) => {
            const player = getPlayerInSlot(key)
            return (
              <div
                key={key}
                style={{ gridRow: row, gridColumn: col }}
                className="flex items-center justify-center"
              >
                {player ? (
                  /* Filled slot */
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #1e4a2e, #16361f)',
                        borderColor: 'rgba(249,115,22,0.75)',
                        color: 'white',
                      }}
                    >
                      {/* Two-letter abbreviation from last name */}
                      {player.name.trim().split(' ').pop()?.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className="text-[8px] font-semibold leading-tight text-center w-12 truncate"
                      style={{ color: 'rgba(255,255,255,0.88)' }}
                    >
                      {chipLabel(player, allPlayers)}
                    </span>
                  </div>
                ) : (
                  /* Empty slot */
                  <div
                    className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center"
                    style={{
                      borderColor: 'rgba(255,255,255,0.18)',
                      background: 'rgba(0,0,0,0.15)',
                    }}
                  >
                    <span
                      className="text-[8px] font-bold"
                      style={{ color: 'rgba(255,255,255,0.28)' }}
                    >
                      {key}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bench ──────────────────────────────────────────────────── */}
      {benchPlayers.length > 0 && (
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Bænk ({benchPlayers.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {benchPlayers.map((p) => (
              <span
                key={p.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--bg-raised)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-faint)',
                }}
              >
                {chipLabel(p, allPlayers)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty pitch state (no starters assigned yet) ─────────── */}
      {starterIds.size === 0 && attendanceIds.size > 0 && (
        <p
          className="text-[10px] text-center mt-1"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          Opstillingen er ikke sat endnu
        </p>
      )}
    </>
  )
}
