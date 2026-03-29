import type { Training } from '../types'

// ── Schedule rule ───────────────────────────────────────────────────────────────
//
// Before SCHEDULE_CUTOFF : training is every Monday  at 19:30
// From  SCHEDULE_CUTOFF  : training is every Tuesday at 20:30
//
// Compare YYYY-MM-DD strings lexicographically — works correctly because ISO dates
// are already in ascending order.

export const SCHEDULE_CUTOFF = '2026-04-06'   // first date of the Tuesday schedule
export const TRAINING_LOCATION = 'Ryparken Idrætsanlæg'

export interface TrainingRule {
  /** Day-of-week index matching getUTCDay(): 1 = Monday, 2 = Tuesday */
  weekday: number
  /** Start time as Copenhagen local 'HH:MM' */
  time: string
  /** Short Danish display string, e.g. "Tirsdag 20:30" */
  label: string
}

/** Returns the training rule that applies on the given YYYY-MM-DD date. */
export function trainingRuleForDate(date: string): TrainingRule {
  return date >= SCHEDULE_CUTOFF
    ? { weekday: 2, time: '20:30', label: 'Tirsdag 20:30' }
    : { weekday: 1, time: '19:30', label: 'Mandag 19:30' }
}

/** Returns the training rule that applies today in Copenhagen. */
export function currentTrainingRule(): TrainingRule {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).format(new Date())
  return trainingRuleForDate(today)
}

/**
 * Generate `count` upcoming training sessions.
 *
 * Rules applied per candidate date:
 *  - Correct weekday for the period (Monday / Tuesday)
 *  - Date must NOT appear in `matchDates`
 *
 * Iterates day-by-day so the Monday→Tuesday cutoff is handled automatically
 * without any special-case transition logic.
 */
export function generateUpcomingTrainings(
  count: number,
  matchDates: Set<string>,
  location = TRAINING_LOCATION,
): Training[] {
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).format(new Date())                             // 'YYYY-MM-DD'

  const [y, m, d] = today.split('-').map(Number)
  const todayMs   = Date.UTC(y, m - 1, d, 12)      // UTC noon — avoids DST edge cases
  const maxDays   = (count * 2 + 6) * 7            // generous search window

  const results: Training[] = []

  for (let i = 0; results.length < count && i < maxDays; i++) {
    const ms      = todayMs + i * 86_400_000
    const dateStr = new Date(ms).toISOString().slice(0, 10)   // 'YYYY-MM-DD'
    const dow     = new Date(ms).getUTCDay()
    const rule    = trainingRuleForDate(dateStr)

    // Skip: wrong weekday or a match is scheduled that day
    if (dow !== rule.weekday || matchDates.has(dateStr)) continue

    results.push({
      id:         `training-${dateStr}`,
      date:       dateStr,
      time:       rule.time,
      location,
      cancelled:  false,
      attendance: [],
      guests:     [],
    })
  }

  return results
}
