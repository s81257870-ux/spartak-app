import { create } from 'zustand'
import type { Training, TrainingGuest } from '../types'
import {
  fetchTrainings,
  upsertTraining,
  signUpForTraining,
  cancelSignUpForTraining,
  updateTrainingGuests,
} from '../lib/supabaseService'

// ── Session generator ──────────────────────────────────────────────────────────
// Produces skeleton Training objects for the next `count` Mondays.
// These are upserted to Supabase on init (ignoreDuplicates: true ensures existing
// rows — which carry real attendance — are never overwritten).

function generateUpcomingMondays(count: number): Training[] {
  const trainings: Training[] = []

  const copenhDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' })
    .format(new Date())
  const [year, month, day] = copenhDate.split('-').map(Number)
  const current = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  const dow = current.getUTCDay()
  const daysToMonday = dow === 1 ? 0 : (8 - dow) % 7
  current.setUTCDate(current.getUTCDate() + daysToMonday)

  for (let i = 0; i < count; i++) {
    const dateStr = current.toISOString().slice(0, 10)
    trainings.push({
      id:         `training-${dateStr}`,
      date:       dateStr,
      time:       '19:30',
      location:   'Ryparken Idrætsanlæg',
      cancelled:  false,
      attendance: [],
      guests:     [],
    })
    current.setUTCDate(current.getUTCDate() + 7)
  }

  return trainings
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface TrainingStore {
  trainings:    Training[]
  loading:      boolean
  initialized:  boolean
  init:         () => Promise<void>
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
  // 1. Generate the upcoming Monday skeleton sessions
  // 2. Fetch existing rows from Supabase
  // 3. Upsert any Monday sessions that don't exist yet (empty attendance)
  // 4. Merge: Supabase data wins (carries real attendance); local fills in new sessions
  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const upcoming     = generateUpcomingMondays(10)
      const existing     = await fetchTrainings()
      const existingMap  = new Map(existing.map((t) => [t.id, t]))

      // Upsert any Monday that isn't in Supabase yet (fires ignoreDuplicates in the service)
      const missing = upcoming.filter((t) => !existingMap.has(t.id))
      await Promise.all(missing.map((t) => upsertTraining(t)))

      // Merge local skeletons with Supabase rows (Supabase data wins)
      const trainings = upcoming.map((t) => existingMap.get(t.id) ?? t)

      set({ trainings, initialized: true, loading: false })
    } catch (err) {
      console.error('[TrainingStore] Supabase init failed, using empty sessions:', err)
      set({ trainings: generateUpcomingMondays(10), initialized: true, loading: false })
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
