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
