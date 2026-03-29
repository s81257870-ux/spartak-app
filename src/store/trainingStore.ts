import { create } from 'zustand'
import type { Training, TrainingGuest } from '../types'
import {
  fetchTrainings,
  upsertTraining,
  signUpForTraining,
  cancelSignUpForTraining,
  updateTrainingGuests,
} from '../lib/supabaseService'
import { generateUpcomingTrainings } from '../utils/trainingSchedule'

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
      const existingMap = new Map(existing.map((t) => [t.id, t]))

      // Upsert sessions not yet in Supabase (ignoreDuplicates keeps existing attendance)
      const missing = upcoming.filter((t) => !existingMap.has(t.id))
      await Promise.all(missing.map((t) => upsertTraining(t)))

      // Merge: Supabase row wins (has real attendance); local skeleton fills new ones
      const trainings = upcoming.map((t) => existingMap.get(t.id) ?? t)

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
