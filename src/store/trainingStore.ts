import { create } from 'zustand'
import type { Training, TrainingGuest } from '../types'
import {
  fetchTrainings,
  upsertTraining,
  signUpForTraining,
  cancelSignUpForTraining,
  updateTrainingGuests,
} from '../lib/supabaseService'
import { generateUpcomingTrainings, TRAINING_LOCATION } from '../utils/trainingSchedule'

// ── Historical seeds ───────────────────────────────────────────────────────────
// Past sessions to seed once into Supabase (ignoreDuplicates preserves real data).
// attendance holds the player IDs who had signed up before the deadline.

const HISTORICAL_SEEDS: Training[] = [
  {
    id:         'training-2026-03-23',
    date:       '2026-03-23',
    time:       '19:30',
    location:   TRAINING_LOCATION,
    cancelled:  false,
    attendance: ['p1', 'p2', 'p3', 'p4'],
    guests:     [],
  },
]

// ── Store ──────────────────────────────────────────────────────────────────────

interface TrainingStore {
  trainings:    Training[]
  loading:      boolean
  initialized:  boolean
  init:         (matchDates: Set<string>) => Promise<void>
  signUp:       (trainingId: string, playerId: string) => void
  cancelSignUp: (trainingId: string, playerId: string) => void
  addGuest:     (trainingId: string, playerId: string, name?: string) => void
  removeGuest:  (trainingId: string, playerId: string) => void
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  trainings:   [],
  loading:     false,
  initialized: false,

  // ── Init ────────────────────────────────────────────────────────────────────
  // 1. Generate upcoming training sessions (Mon→Tue rule, match days excluded)
  // 2. Fetch existing rows from Supabase
  // 3. Upsert any new sessions that don't exist yet (ignoreDuplicates preserves attendance)
  // 4. Merge: Supabase data wins (carries real attendance); local fills new sessions
  //
  // `matchDates` — Set of 'YYYY-MM-DD' strings; any matching date is skipped.
  // Must be passed by the caller after the match store is initialised.
  init: async (matchDates: Set<string>) => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const upcoming    = generateUpcomingTrainings(10, matchDates)
      const existing    = await fetchTrainings()
      const existingIds = new Set(existing.map((t) => t.id))

      // Upsert sessions not yet in Supabase (ignoreDuplicates keeps existing attendance)
      const missingUpcoming    = upcoming.filter((t) => !existingIds.has(t.id))
      const missingHistorical  = HISTORICAL_SEEDS.filter((t) => !existingIds.has(t.id))
      await Promise.all([
        ...missingUpcoming.map((t) => upsertTraining(t)),
        ...missingHistorical.map((t) => upsertTraining(t)),
      ])

      // Re-fetch all rows (past historical + upcoming); Supabase is source of truth
      const trainings = await fetchTrainings()

      set({ trainings, initialized: true, loading: false })
    } catch (err) {
      console.error('[TrainingStore] Supabase init failed, using generated sessions:', err)
      set({ trainings: generateUpcomingTrainings(10, matchDates), initialized: true, loading: false })
    }
  },

  // ── Attendance — optimistic update then async Supabase write ────────────────
  signUp: (trainingId, playerId) => {
    const t = get().trainings.find((t) => t.id === trainingId)
    if (!t || t.attendance.includes(playerId)) return
    const updated = [...t.attendance, playerId]
    set((s) => ({
      trainings: s.trainings.map((t) =>
        t.id === trainingId ? { ...t, attendance: updated } : t
      ),
    }))
    signUpForTraining(trainingId, playerId, t.attendance).catch((err) =>
      console.error('[TrainingStore] signUp failed:', err)
    )
  },

  cancelSignUp: (trainingId, playerId) => {
    const t = get().trainings.find((t) => t.id === trainingId)
    if (!t) return
    const updatedAttendance = t.attendance.filter((id) => id !== playerId)
    const updatedGuests     = t.guests.filter((g) => g.addedBy !== playerId)
    set((s) => ({
      trainings: s.trainings.map((t) =>
        t.id === trainingId
          ? { ...t, attendance: updatedAttendance, guests: updatedGuests }
          : t
      ),
    }))
    cancelSignUpForTraining(trainingId, playerId, t.attendance, t.guests).catch((err) =>
      console.error('[TrainingStore] cancelSignUp failed:', err)
    )
  },

  addGuest: (trainingId, playerId, name) => {
    const t = get().trainings.find((t) => t.id === trainingId)
    if (!t) return
    const guest: TrainingGuest = {
      id:      `guest-${trainingId}-${playerId}`,
      addedBy: playerId,
      name:    name?.trim() || undefined,
    }
    const updatedGuests = [...t.guests.filter((g) => g.addedBy !== playerId), guest]
    set((s) => ({
      trainings: s.trainings.map((t) =>
        t.id === trainingId ? { ...t, guests: updatedGuests } : t
      ),
    }))
    updateTrainingGuests(trainingId, updatedGuests).catch((err) =>
      console.error('[TrainingStore] addGuest failed:', err)
    )
  },

  removeGuest: (trainingId, playerId) => {
    const t = get().trainings.find((t) => t.id === trainingId)
    if (!t) return
    const updatedGuests = t.guests.filter((g) => g.addedBy !== playerId)
    set((s) => ({
      trainings: s.trainings.map((t) =>
        t.id === trainingId ? { ...t, guests: updatedGuests } : t
      ),
    }))
    updateTrainingGuests(trainingId, updatedGuests).catch((err) =>
      console.error('[TrainingStore] removeGuest failed:', err)
    )
  },
}))
