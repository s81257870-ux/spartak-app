/**
 * matchTime.ts — timezone-safe match state helpers for Europe/Copenhagen.
 *
 * The Match.date field is an ISO string in one of two forms:
 *   - "2026-04-07"          (date-only → kickoff assumed at 00:00 Copenhagen)
 *   - "2026-04-07T20:30"    (date + time, treated as Europe/Copenhagen local time)
 *
 * We never do new Date(isoString) directly because that is UTC on platforms that
 * follow the spec for date-only strings, and the TZ offset at kickoff time differs
 * from the offset right now (DST transitions). Instead we read the current instant
 * as a Copenhagen "YYYY-MM-DDTHH:MM" string and compare lexicographically — valid
 * because the format is strictly left-to-right significant.
 */

import type { Match } from '../types'

/**
 * Returns current date-time in Europe/Copenhagen as "YYYY-MM-DDTHH:MM".
 * Uses the Swedish locale ("sv-SE") because it produces "YYYY-MM-DD HH:MM" which
 * only needs a single space→T replacement.
 */
export function nowInCopenhagen(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
  })
    .format(new Date())
    .replace(' ', 'T')   // "2026-04-07 20:45" → "2026-04-07T20:45"
}

/**
 * Normalises a match date string to "YYYY-MM-DDTHH:MM" (Copenhagen local time).
 * Date-only strings are given time "00:00".
 */
function kickoffString(match: Match): string {
  const { date } = match
  if (date.includes('T')) {
    // Already has time — take only first 16 chars in case seconds are present
    return date.slice(0, 16)
  }
  return `${date}T00:00`
}

/**
 * Returns the kickoff string advanced by `minutes` minutes.
 * Works purely via Date arithmetic so DST is handled automatically.
 */
function kickoffPlusMinutes(match: Match, minutes: number): string {
  const [datePart, timePart] = kickoffString(match).split('T')
  const [y, mo, d]  = datePart.split('-').map(Number)
  const [h, mi]     = timePart.split(':').map(Number)

  // Construct a Date in LOCAL (browser) time — we only need the arithmetic, not
  // the absolute UTC value, so this is fine as long as we convert back via
  // the same Copenhagen formatter.
  const base = new Date(y, mo - 1, d, h, mi, 0, 0)
  base.setMinutes(base.getMinutes() + minutes)

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
    hour:     '2-digit',
    minute:   '2-digit',
  })
    .format(base)
    .replace(' ', 'T')
}

// ─── Time-until-kickoff ────────────────────────────────────────────────────

export interface TimeUntilKickoff {
  /** Full calendar days remaining (Copenhagen boundaries). 0 = today. */
  days: number
  /** Remaining hours within the same day (0–23). */
  hours: number
  /** Remaining minutes within the same hour (0–59). */
  minutes: number
  /** Total minutes until kickoff (≥ 0). 0 means now or past. */
  totalMinutes: number
}

/**
 * Returns the time remaining until kickoff, split into days / hours / minutes,
 * all resolved against Europe/Copenhagen local time.
 *
 * Day boundaries are Calendar-day boundaries in Copenhagen, not raw 24-hour
 * blocks, so the count never decrements early in the evening.
 *
 * Same-day hours/minutes are computed by comparing Copenhagen "HH:MM" strings
 * directly — no UTC offset arithmetic, no Date.now() drift.
 */
export function getTimeUntilKickoff(match: Match): TimeUntilKickoff {
  const zero: TimeUntilKickoff = { days: 0, hours: 0, minutes: 0, totalMinutes: 0 }

  const now     = nowInCopenhagen()   // "YYYY-MM-DDTHH:MM"
  const kickoff = kickoffString(match) // "YYYY-MM-DDTHH:MM"

  if (now >= kickoff) return zero

  const [nowDate,  nowTime]  = now.split('T')
  const [kickDate, kickTime] = kickoff.split('T')

  // ── Calendar-day diff (Copenhagen date parts → UTC midnight, no DST issue) ──
  const [ny, nm, nd] = nowDate.split('-').map(Number)
  const [ky, km, kd] = kickDate.split('-').map(Number)
  const days = Math.round(
    (Date.UTC(ky, km - 1, kd) - Date.UTC(ny, nm - 1, nd)) / 86_400_000
  )

  if (days > 0) {
    return { days, hours: 0, minutes: 0, totalMinutes: days * 1440 }
  }

  // ── Same calendar day — use Copenhagen HH:MM strings for the minute diff ──
  const [nh, nmin] = nowTime.split(':').map(Number)
  const [kh, kmin] = kickTime.split(':').map(Number)
  const totalMinutes = Math.max(0, (kh * 60 + kmin) - (nh * 60 + nmin))

  return {
    days:         0,
    hours:        Math.floor(totalMinutes / 60),
    minutes:      totalMinutes % 60,
    totalMinutes,
  }
}

// ─── Match live / completed state ─────────────────────────────────────────

/**
 * Returns true when the current Copenhagen time >= match kickoff.
 * i.e. the match has started (or is starting right now).
 */
export function isMatchLive(match: Match): boolean {
  if (match.isCompleted) return false
  const now     = nowInCopenhagen()
  const kickoff = kickoffString(match)
  return now >= kickoff
}

/**
 * Returns true when the current Copenhagen time > kickoff + 110 minutes
 * (90 min regulation + 20 min max stoppage).
 * Used as a fallback to consider the match finished when isCompleted hasn't
 * been set by an admin yet.
 */
export function isMatchCompleted(match: Match): boolean {
  if (match.isCompleted) return true
  const now        = nowInCopenhagen()
  const endOfMatch = kickoffPlusMinutes(match, 110)
  return now > endOfMatch
}
