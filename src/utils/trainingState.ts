/**
 * trainingState.ts
 *
 * Central logic for deciding whether a training is "upcoming" or "past".
 *
 * A training stays in the "next training" area until TRAINING_WINDOW_HOURS
 * after its scheduled start time.  After that it moves to "Forrige træninger".
 * This applies equally to normal, cancelled, and low-attendance trainings.
 *
 * All comparisons use Copenhagen local time ("sv-SE" locale trick) to match
 * the same pattern used by isDeadlinePassed in Trainings.tsx.
 */

import type { Training } from '../types'

/** How many hours after start a training stays in the "next" slot. */
export const TRAINING_WINDOW_HOURS = 2

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Copenhagen "now" as 'YYYY-MM-DDTHH:MM'. */
function copNow(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone:  'Europe/Copenhagen',
    year:      'numeric',
    month:     '2-digit',
    day:       '2-digit',
    hour:      '2-digit',
    minute:    '2-digit',
  }).format(new Date()).replace(' ', 'T')
}

/**
 * Returns the Copenhagen 'YYYY-MM-DDTHH:MM' string at which a training
 * transitions from "next" to "previous".
 * Handles midnight overflow (e.g. 23:30 + 2h → next day 01:30).
 */
export function trainingCutoff(date: string, time: string): string {
  const [hh, mm]   = time.split(':').map(Number)
  const totalMins  = hh * 60 + mm + TRAINING_WINDOW_HOURS * 60
  const cutoffH    = Math.floor(totalMins / 60) % 24
  const cutoffM    = totalMins % 60
  const padded     = `${String(cutoffH).padStart(2, '0')}:${String(cutoffM).padStart(2, '0')}`

  if (totalMins < 24 * 60) {
    return `${date}T${padded}`
  }

  // Day overflow — advance calendar date by one
  const [y, m, d] = date.split('-').map(Number)
  const nextDay   = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  return `${nextDay}T${padded}`
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * True if the training has passed its post-start window.
 * Example: training starts 20:30 → isPastCutoff returns true after 22:30.
 */
export function isPastCutoff(training: Training): boolean {
  return copNow() >= trainingCutoff(training.date, training.time)
}

/**
 * The "next" training — the first one that has NOT yet passed its cutoff.
 * Returns undefined when all trainings have expired (edge case).
 */
export function getNextTraining(trainings: Training[]): Training | undefined {
  return trainings.find((t) => !isPastCutoff(t))
}

/**
 * All trainings that have passed their cutoff, most recent first.
 * These are displayed under "Forrige træninger".
 */
export function getPastTrainings(trainings: Training[]): Training[] {
  return trainings.filter((t) => isPastCutoff(t)).reverse()
}

/**
 * All trainings that have NOT yet passed their cutoff, ascending order.
 * trainings[0] of this list is always the current "next training".
 */
export function getUpcomingTrainings(trainings: Training[]): Training[] {
  return trainings.filter((t) => !isPastCutoff(t))
}
