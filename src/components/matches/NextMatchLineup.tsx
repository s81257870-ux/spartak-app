/**
 * NextMatchLineup — compact split-layout card content for the Home page.
 *
 * Responsive sizing is driven entirely by CSS custom properties:
 *
 *   token            mobile    md(768)   lg(1024)
 *   --nm-grid-cols   1fr auto  1fr auto  1.1fr 1fr  ← balanced split at lg
 *   --nm-pitch-w     130px     176px     100%       ← fills column at lg
 *   --nm-pitch-rh     50px      62px      80px
 *   --nm-dot          18px      24px      28px
 *   --nm-pitch-pad     4px       6px       8px
 *   --nm-gap          16px      24px      28px
 *
 * Text sizes use Tailwind responsive prefixes (md: / lg:).
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

/**
 * Pitch label: plain surname, no disambiguation suffix.
 * CSS truncation (ellipsis) handles anything too long to fit — the user sees
 * "Hesselb..." rather than a cryptic initial like "H." or "He.".
 * The bench uses chipLabel (with squad-wide disambiguation) since it has more room.
 */
function pitchLabel(player: Player): string {
  const parts = player.name.trim().split(' ')
  return parts[parts.length - 1]
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
          gridTemplateColumns: 'var(--nm-grid-cols)',
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

          {/* Signed-up count — pill badge */}
          <span
            className="inline-flex items-center mt-2.5 md:mt-3 text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(74,222,128,0.12)',
              color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.20)',
            }}
          >
            {match.attendance.length === 1
              ? '1 spiller tilmeldt'
              : `${match.attendance.length} spillere tilmeldt`}
          </span>

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
                          className="text-[8px] md:text-[10px] lg:text-[12px] font-semibold leading-none text-center truncate block"
                          style={{
                            color: 'rgba(255,255,255,0.92)',
                            /* Cell width = (pitch_w − 2×pad) / 3; −2px safety margin */
                            maxWidth: 'calc((var(--nm-pitch-w) - 2 * var(--nm-pitch-pad)) / 3 - 2px)',
                          }}
                        >
                          {pitchLabel(player)}
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
