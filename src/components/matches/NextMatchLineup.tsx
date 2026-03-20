/**
 * NextMatchLineup — compact split-layout card content for the Home page.
 *
 * Responsive sizing is driven entirely by CSS custom properties:
 *   --nm-pitch-w   : pitch width          (130 px → 176 px at md)
 *   --nm-pitch-rh  : row height per row   ( 42 px →  56 px at md)
 *   --nm-dot       : player dot diameter  ( 18 px →  24 px at md)
 *   --nm-pitch-pad : inner grid padding   (  4 px →   6 px at md)
 *   --nm-gap       : info ↔ pitch gap     ( 16 px →  24 px at md)
 *
 * Text sizes use Tailwind responsive prefixes (md:).
 * No JS needed for breakpoint detection.
 *
 * Data derivation:
 *   starters : Object.values(match.lineup) ∩ match.attendance
 *   bench    : match.attendance − starters
 */

import type { Match, Player, Position } from '../../types'
import { getFormation } from '../../data/formations'
import { chipLabel } from '../../utils/playerName'

interface Props {
  match: Match
  allPlayers: Player[]
}

/** Timezone-safe — parses date parts directly so no UTC-midnight weekday shift. */
function formatMatchDate(iso: string): string {
  const [datePart] = iso.split('T')
  const [y, m, d]  = datePart.split('-').map(Number)
  const dateObj    = new Date(y, m - 1, d)
  const weekday    = dateObj.toLocaleDateString('da-DK', { weekday: 'short' })
  const dayMonth   = dateObj.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  const time       = iso.includes('T') ? iso.split('T')[1]?.slice(0, 5) : ''
  return time ? `${weekday} ${dayMonth} · ${time}` : `${weekday} ${dayMonth}`
}

// SVG viewBox uses fixed mobile coordinates; preserveAspectRatio="none" handles scaling.
const SVG_W  = 130
const SVG_RH = 50   // matches --nm-pitch-rh mobile value (for viewBox arithmetic only)

export default function NextMatchLineup({ match, allPlayers }: Props) {
  const formation     = getFormation(match.formation)
  const attendanceIds = new Set(match.attendance ?? [])

  const starterIds = new Set(
    Object.values(match.lineup).filter((pid) => attendanceIds.has(pid))
  )
  const benchPlayers = allPlayers.filter(
    (p) => attendanceIds.has(p.id) && !starterIds.has(p.id)
  )

  const getPlayerInSlot = (pos: Position): Player | undefined => {
    const pid = match.lineup[pos]
    if (!pid || !attendanceIds.has(pid)) return undefined
    return allPlayers.find((p) => p.id === pid)
  }

  const maxRow         = Math.max(...formation.slots.map((s) => s.row))
  const svgH           = maxRow * SVG_RH                         // viewBox height (mobile coords)
  const hasSomeStarter = starterIds.size > 0

  return (
    <>
      {/* ── Split grid: left = info | right = mini pitch ───────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 'var(--nm-gap)',
          alignItems: 'start',
        }}
      >

        {/* ── LEFT: match info ───────────────────────────────────────── */}
        <div className="min-w-0">

          {/* Title */}
          <p
            className="font-bold text-base md:text-xl leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            Spartak vs. {match.opponent}
          </p>

          {/* Date · time */}
          <p
            className="text-sm md:text-base mt-0.5 md:mt-1"
            style={{ color: 'rgba(249,115,22,0.88)' }}
          >
            {formatMatchDate(match.date)}
          </p>

          {/* Location */}
          <p
            className="text-sm md:text-base mt-0.5 md:mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {match.location}
          </p>

          {/* Signed-up count */}
          <p
            className="text-xs md:text-sm mt-2.5 md:mt-3"
            style={{ color: 'var(--text-faint)' }}
          >
            {match.attendance.length === 1
              ? '1 spiller tilmeldt'
              : `${match.attendance.length} spillere tilmeldt`}
          </p>

        </div>

        {/* ── RIGHT: mini pitch ──────────────────────────────────────── */}
        <div
          className="relative rounded-xl overflow-hidden shrink-0"
          style={{
            width:  'var(--nm-pitch-w)',
            /* calc() with a CSS <length> × <number> is valid CSS */
            height: `calc(var(--nm-pitch-rh) * ${maxRow})`,
            background: 'linear-gradient(180deg, #1e4a2e 0%, #15341d 45%, #15341d 55%, #1e4a2e 100%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          }}
        >
          {/* Pitch markings — fixed viewBox, scaled via preserveAspectRatio="none" */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${SVG_W} ${svgH}`}
            preserveAspectRatio="none"
          >
            <rect
              x="3" y="3" width={SVG_W - 6} height={svgH - 6} rx="2"
              fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1"
            />
            <line
              x1="3" y1={svgH / 2} x2={SVG_W - 3} y2={svgH / 2}
              stroke="white" strokeOpacity="0.12" strokeWidth="0.75"
            />
            {Array.from({ length: maxRow }, (_, i) => (
              <rect
                key={i}
                x="3"
                y={3 + i * ((svgH - 6) / maxRow)}
                width={SVG_W - 6}
                height={(svgH - 6) / maxRow}
                fill="white"
                fillOpacity={i % 2 === 0 ? 0.035 : 0}
              />
            ))}
          </svg>

          {/* Empty state */}
          {!hasSomeStarter && (
            <div className="absolute inset-0 flex items-center justify-center px-3">
              <p
                className="text-[9px] md:text-[11px] text-center leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                Ingen opstilling endnu
              </p>
            </div>
          )}

          {/* Player dots */}
          {hasSomeStarter && (
            <div
              className="absolute inset-0"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${maxRow}, 1fr)`,
                gridTemplateColumns: 'repeat(3, 1fr)',
                padding: 'var(--nm-pitch-pad)',
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
                      /* Filled slot: dot + readable last-name label below */
                      <div className="flex flex-col items-center gap-0.5">
                        <div
                          style={{
                            width:  'var(--nm-dot)',
                            height: 'var(--nm-dot)',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: 'linear-gradient(135deg, #2d6a43, #1a4228)',
                            border: '1.5px solid rgba(249,115,22,0.82)',
                            boxShadow: '0 0 6px rgba(249,115,22,0.22)',
                          }}
                        />
                        <span
                          className="text-[8px] md:text-[10px] font-semibold leading-none text-center truncate block"
                          style={{
                            color: 'rgba(255,255,255,0.92)',
                            maxWidth: 'calc(var(--nm-pitch-w) / 3 - 2px)',
                          }}
                        >
                          {chipLabel(player, allPlayers)}
                        </span>
                      </div>
                    )}
                    {/* Empty slot: render nothing — no dashed placeholder */}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bench ─────────────────────────────────────────────────────── */}
      {benchPlayers.length > 0 && (
        <p
          className="mt-2.5 md:mt-3 text-[11px] md:text-sm leading-snug"
          style={{ color: 'var(--text-faint)' }}
        >
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
      <p
        className="text-[11px] md:text-[13px] mt-3 md:mt-4"
        style={{ color: 'var(--text-faint)' }}
      >
        Tryk for at se kamp →
      </p>
    </>
  )
}
