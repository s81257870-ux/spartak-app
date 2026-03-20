/**
 * NextMatchLineup — compact split-layout card content for the Home page.
 *
 * Layout:  [ match info (1fr) | mini pitch (auto) ]
 *          [ bench row (full width, below grid)   ]
 *          [ footer tap hint                       ]
 *
 * Data derivation:
 *   - formation  : getFormation(match.formation)
 *   - starters   : Object.values(match.lineup) ∩ match.attendance
 *   - bench      : match.attendance − starters
 *
 * Display-only. No drag-and-drop, no admin controls.
 */

import type { Match, Player, Position } from '../../types'
import { getFormation } from '../../data/formations'
import { chipLabel } from '../../utils/playerName'

interface Props {
  match: Match
  allPlayers: Player[]
}

/** Timezone-safe: parse date parts directly to avoid UTC-midnight shift. */
function formatMatchDate(iso: string): string {
  const [datePart] = iso.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const dateObj  = new Date(y, m - 1, d)          // local time — no TZ offset
  const weekday  = dateObj.toLocaleDateString('da-DK', { weekday: 'short' })
  const dayMonth = dateObj.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  const time     = iso.includes('T') ? iso.split('T')[1]?.slice(0, 5) : ''
  return time ? `${weekday} ${dayMonth} · ${time}` : `${weekday} ${dayMonth}`
}

// ─── Mini pitch constants ─────────────────────────────────────────────────────
const PITCH_W = 130   // px  (120–160 per spec)
const ROW_H   = 42    // px per formation row
const DOT     = 18    // px  player dot diameter

export default function NextMatchLineup({ match, allPlayers }: Props) {
  const formation     = getFormation(match.formation)
  const attendanceIds = new Set(match.attendance ?? [])

  // Starters: lineup values still present in attendance (guards stale IDs)
  const starterIds = new Set(
    Object.values(match.lineup).filter((pid) => attendanceIds.has(pid))
  )

  // Bench: signed-up players not on the pitch
  const benchPlayers = allPlayers.filter(
    (p) => attendanceIds.has(p.id) && !starterIds.has(p.id)
  )

  const getPlayerInSlot = (pos: Position): Player | undefined => {
    const pid = match.lineup[pos]
    if (!pid || !attendanceIds.has(pid)) return undefined
    return allPlayers.find((p) => p.id === pid)
  }

  const maxRow  = Math.max(...formation.slots.map((s) => s.row))
  const pitchH  = maxRow * ROW_H
  const hasSomeStarter = starterIds.size > 0

  return (
    <>
      {/* ── Split grid: left=info, right=mini-pitch ───────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: match info ─────────────────────────────────────────── */}
        <div className="min-w-0">

          {/* Title */}
          <p
            className="font-bold text-base leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            Spartak vs. {match.opponent}
          </p>

          {/* Date · time */}
          <p className="text-sm mt-0.5" style={{ color: 'rgba(249,115,22,0.88)' }}>
            {formatMatchDate(match.date)}
          </p>

          {/* Location */}
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {match.location}
          </p>

          {/* Signed-up count */}
          <p className="text-xs mt-2.5" style={{ color: 'var(--text-faint)' }}>
            {match.attendance.length === 1
              ? '1 spiller tilmeldt'
              : `${match.attendance.length} spillere tilmeldt`}
          </p>

        </div>

        {/* ── RIGHT: mini pitch ─────────────────────────────────────────── */}
        <div
          className="relative rounded-xl overflow-hidden shrink-0"
          style={{
            width:  `${PITCH_W}px`,
            height: `${pitchH}px`,
            background: 'linear-gradient(180deg, #1e4a2e 0%, #15341d 45%, #15341d 55%, #1e4a2e 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          {/* Pitch markings */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${PITCH_W} ${pitchH}`}
            preserveAspectRatio="none"
          >
            {/* Border */}
            <rect
              x="3" y="3" width={PITCH_W - 6} height={pitchH - 6} rx="2"
              fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1"
            />
            {/* Centre line */}
            <line
              x1="3" y1={pitchH / 2} x2={PITCH_W - 3} y2={pitchH / 2}
              stroke="white" strokeOpacity="0.12" strokeWidth="0.75"
            />
            {/* Alternating row tint */}
            {Array.from({ length: maxRow }, (_, i) => (
              <rect
                key={i}
                x="3"
                y={3 + i * ((pitchH - 6) / maxRow)}
                width={PITCH_W - 6}
                height={(pitchH - 6) / maxRow}
                fill="white"
                fillOpacity={i % 2 === 0 ? 0.035 : 0}
              />
            ))}
          </svg>

          {/* Empty state */}
          {!hasSomeStarter && (
            <div className="absolute inset-0 flex items-center justify-center px-3">
              <p
                className="text-[9px] text-center leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                Ingen opstilling endnu
              </p>
            </div>
          )}

          {/* Player dots — only shown if at least one starter is placed */}
          {hasSomeStarter && (
            <div
              className="absolute inset-0"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${maxRow}, 1fr)`,
                gridTemplateColumns: 'repeat(3, 1fr)',
                padding: '4px',
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
                    {player && (
                      /* Filled: orange-rimmed dot — no label at this scale */
                      <div
                        style={{
                          width:  `${DOT}px`,
                          height: `${DOT}px`,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #2d6a43, #1a4228)',
                          border: '1.5px solid rgba(249,115,22,0.82)',
                          boxShadow: '0 0 6px rgba(249,115,22,0.22)',
                        }}
                      />
                    )}
                    {/* Empty slot: render nothing (no dashed placeholder) */}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bench row ─────────────────────────────────────────────────── */}
      {benchPlayers.length > 0 && (
        <p className="mt-2.5 text-[11px] leading-snug" style={{ color: 'var(--text-faint)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Bænk: </span>
          {benchPlayers.map((p, i) => (
            <span key={p.id}>
              {chipLabel(p, allPlayers)}
              {i < benchPlayers.length - 1 && (
                <span style={{ color: 'var(--text-dimmer)' }}> · </span>
              )}
            </span>
          ))}
        </p>
      )}

      {/* ── Tap hint ──────────────────────────────────────────────────── */}
      <p className="text-[11px] mt-3" style={{ color: 'var(--text-faint)' }}>
        Tryk for at se kamp →
      </p>
    </>
  )
}
