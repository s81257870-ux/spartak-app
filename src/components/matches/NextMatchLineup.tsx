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

import { useState, useEffect } from 'react'
import { Clock, Radio, ChevronRight } from 'lucide-react'
import type { Match, Player, Position } from '../../types'
import { getFormation } from '../../data/formations'
import { chipLabel } from '../../utils/playerName'
import { CLUB_NAME } from '../../data/leagueTable'
import { useMatchStore } from '../../store/matchStore'
import { isMatchLive, isMatchCompleted, getTimeUntilKickoff } from '../../utils/matchTime'
import { fmtShortWithTime } from '../../utils/dateFormat'
import { groupGoalScorers } from '../../utils/matchEvents'

interface Props {
  match: Match
  allPlayers: Player[]
}

/**
 * Pitch label: full player name. CSS truncation (ellipsis) handles anything
 * too long to fit on the mini pitch. The bench uses chipLabel (with
 * squad-wide disambiguation) since it has more room.
 */
function pitchLabel(player: Player): string {
  return player.name.trim()
}


/**
 * Formats the time remaining until a match into a human-readable Danish string.
 *
 * Thresholds (all in Europe/Copenhagen time):
 *   > 1 day          → "Om X dage"
 *   == 1 day         → "Om 1 dag"
 *   same day, ≥ 1h   → "Om X timer og Y min"  (omits minutes when Y == 0)
 *   same day, < 1h   → "Starter om X min"
 *   < 1 min / past   → "Starter nu"
 */
function formatCountdown(match: Match): string {
  const { days, hours, minutes, totalMinutes } = getTimeUntilKickoff(match)

  if (totalMinutes <= 0)  return 'Starter nu'
  if (days > 1)           return `Om ${days} dage`
  if (days === 1)         return 'Om 1 dag'

  // Same day
  if (totalMinutes < 60)  return `Starter om ${minutes} min`

  // ≥ 1 hour — show hours and optionally minutes
  const timerDel = hours === 1 ? 'time' : 'timer'
  if (minutes === 0)      return `Om ${hours} ${timerDel}`
  return `Om ${hours} ${timerDel} og ${minutes} min`
}

/** Polls getTimeUntilKickoff every 60 s so the label updates automatically. */
function useCountdown(match: Match): string {
  const [label, setLabel] = useState(() => formatCountdown(match))
  useEffect(() => {
    const calc = () => setLabel(formatCountdown(match))
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [match])
  return label
}

/**
 * Polls isMatchLive / isMatchCompleted every 60 seconds so the UI transitions
 * automatically at kickoff without a page refresh.
 */
function useMatchState(match: Match): { live: boolean; completed: boolean } {
  const [state, setState] = useState(() => ({
    live:      isMatchLive(match),
    completed: isMatchCompleted(match),
  }))

  useEffect(() => {
    const recalc = () =>
      setState({
        live:      isMatchLive(match),
        completed: isMatchCompleted(match),
      })

    recalc()
    const id = setInterval(recalc, 60_000)
    return () => clearInterval(id)
  }, [match])

  return state
}

// SVG viewBox uses fixed mobile coordinates; preserveAspectRatio="none" handles scaling.
const SVG_W  = 130
const SVG_RH = 50   // matches --nm-pitch-rh mobile value (for viewBox arithmetic only)

export default function NextMatchLineup({ match, allPlayers }: Props) {
  const countdown      = useCountdown(match)
  const { live, completed } = useMatchState(match)
  const initializeLiveScore = useMatchStore((s) => s.initializeLiveScore)

  // As soon as the match goes live, ensure scores are initialised to 0–0
  useEffect(() => {
    if (live && !match.isCompleted) {
      initializeLiveScore(match.id)
    }
  }, [live, match.isCompleted, match.id, initializeLiveScore])

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
      {/* ── Split grid: left = info | right = mini pitch (only when lineup exists) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasSomeStarter ? 'var(--nm-grid-cols)' : '1fr',
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
            {CLUB_NAME} vs. {match.opponent}
          </p>

          {/* Date · time */}
          <p
            className="text-sm md:text-base mt-0.5 md:mt-1"
            style={{ color: 'var(--nm-date-color)' }}
          >
            {fmtShortWithTime(match.date)}
          </p>

          {/* Location */}
          <p
            className="text-sm md:text-base mt-0.5 md:mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {match.location}
          </p>

          {/* Badges row: attendance + live/countdown/result */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 md:mt-3">
            <span
              className="inline-flex items-center text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-full"
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

            {/* LIVE badge — shown when kickoff has passed and match not yet completed */}
            {live && !completed && (
              <span
                key="live"
                className="inline-flex items-center gap-1 text-[11px] md:text-xs font-bold px-2 py-0.5 rounded-full animate-pulse animate-badge-pop"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.30)',
                }}
              >
                <Radio size={9} />
                LIVE {match.scoreUs}–{match.scoreThem}
              </span>
            )}

            {/* Final score badge — shown after match is completed (by admin or 110-min timeout) */}
            {completed && (
              <span
                key="completed"
                className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-full animate-badge-pop"
                style={{
                  background: 'var(--bg-raised)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                Afsluttet {match.scoreUs}–{match.scoreThem}
              </span>
            )}

            {/* Countdown — only shown when match is upcoming */}
            {!live && !completed && countdown && (
              <span
                key={countdown}
                className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-full animate-badge-pop"
                style={{
                  background: 'var(--icon-accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--badge-accent-border)',
                }}
              >
                <Clock size={9} />
                {countdown}
              </span>
            )}
          </div>

          {/* ── Live scorer summary ───────────────────────────────── */}
          {live && !completed && match.events.filter((e) => e.type === 'goal' && e.team === 'us').length > 0 && (
            <div className="mt-2 space-y-0.5">
              {groupGoalScorers(match.events, allPlayers).map((s) => (
                <p key={s.name} className="text-[11px] leading-snug">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {s.name}{s.count > 1 && ` (${s.count})`}
                  </span>
                  {s.assists.length > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {' · '}Assist: {s.assists.join(', ')}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

        </div>

        {/* ── RIGHT: mini pitch — only rendered when lineup exists ──── */}
        {hasSomeStarter && (
          <div
            className="relative rounded-xl overflow-hidden shrink-0"
            style={{
              width:  'var(--nm-pitch-w)',
              height: `calc(var(--nm-pitch-rh) * ${maxRow})`,
              background: 'linear-gradient(180deg, #1e4a2e 0%, #15341d 45%, #15341d 55%, #1e4a2e 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            }}
          >
            {/* Pitch markings */}
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

            {/* Player dots */}
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
                      <div className="flex flex-col items-center gap-0.5">
                        <div
                          style={{
                            width:  'var(--nm-dot)',
                            height: 'var(--nm-dot)',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: 'linear-gradient(135deg, #2d6a43, #1a4228)',
                            border: '1.5px solid var(--dot-border)',
                            boxShadow: '0 0 6px var(--dot-glow)',
                          }}
                        />
                        <span
                          className="text-[8px] md:text-[10px] lg:text-[11px] font-semibold leading-none text-center truncate block w-full px-0.5"
                          style={{ color: 'rgba(255,255,255,0.92)' }}
                        >
                          {pitchLabel(player)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
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

      {/* ── Attendance chips ──────────────────────────────── */}
      {match.attendance.length > 0 && (
        <div className="mt-2.5 md:mt-3 pt-2.5 md:pt-3" style={{ borderTop: '1px solid var(--border-faint)' }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: 'var(--text-dimmer)' }}>
            Fremmøde
          </p>
          <div className="flex flex-wrap gap-1.5">
            {match.attendance.map((pid) => {
              const p = allPlayers.find((pl) => pl.id === pid)
              if (!p) return null
              return (
                <span
                  key={pid}
                  className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(74,222,128,0.10)',
                    border: '1px solid rgba(74,222,128,0.22)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#4ade80' }} />
                  {p.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tap hint ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between mt-3 md:mt-4 pt-2.5"
        style={{ borderTop: '1px solid var(--border-faint)' }}
      >
        <span
          className="text-[11px] md:text-[13px] font-semibold"
          style={{ color: 'var(--text-muted)' }}
        >
          Se kampdetaljer
        </span>
        <span
          className="inline-flex items-center gap-0.5 text-[11px] md:text-[13px] font-bold"
          style={{ color: 'var(--accent)' }}
        >
          Se kamp
          <ChevronRight size={14} strokeWidth={2.5} />
        </span>
      </div>
    </>
  )
}
