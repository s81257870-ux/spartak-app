import { create } from 'zustand'
import type { Training, TrainingGuest } from '../types'

// ── Persistence ────────────────────────────────────────────────────────────────

const ATTENDANCE_KEY = 'spartak_training_attendance'
const GUESTS_KEY     = 'spartak_training_guests'

function loadAttendance(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) ?? '{}') }
  catch { return {} }
}

function loadGuests(): Record<string, TrainingGuest[]> {
  try { return JSON.parse(localStorage.getItem(GUESTS_KEY) ?? '{}') }
  catch { return {} }
}

function saveAttendance(map: Record<string, string[]>) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(map))
}

function saveGuests(map: Record<string, TrainingGuest[]>) {
  localStorage.setItem(GUESTS_KEY, JSON.stringify(map))
}

// ── Session generator ──────────────────────────────────────────────────────────

function generateUpcomingMondays(count: number): Training[] {
  const trainings: Training[] = []

  const copenhDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' })
    .format(new Date())
  const [year, month, day] = copenhDate.split('-').map(Number)
  const current = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  const dow = current.getUTCDay()
  const daysToMonday = dow === 1 ? 0 : (8 - dow) % 7
  current.setUTCDate(current.getUTCDate() + daysToMonday)

  const savedAttendance = loadAttendance()
  const savedGuests     = loadGuests()

  for (let i = 0; i < count; i++) {
    const dateStr = current.toISOString().slice(0, 10)
    const id = `training-${dateStr}`
    trainings.push({
      id,
      date:       dateStr,
      time:       '19:30',
      location:   'Ryparken Idrætsanlæg',
      cancelled:  false,
      attendance: savedAttendance[id] ?? [],
      guests:     savedGuests[id]     ?? [],
    })
    current.setUTCDate(current.getUTCDate() + 7)
  }

  return trainings
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface TrainingStore {
  trainings:    Training[]
  signUp:       (trainingId: string, playerId: string) => void
  cancelSignUp: (trainingId: string, playerId: string) => void
  addGuest:     (trainingId: string, playerId: string, name?: string) => void
  removeGuest:  (trainingId: string, playerId: string) => void
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  trainings: generateUpcomingMondays(10),

  signUp: (trainingId, playerId) => {
    const updated = get().trainings.map((t) => {
      if (t.id !== trainingId || t.attendance.includes(playerId)) return t
      return { ...t, attendance: [...t.attendance, playerId] }
    })
    saveAttendance(Object.fromEntries(updated.map((t) => [t.id, t.attendance])))
    set({ trainings: updated })
  },

  cancelSignUp: (trainingId, playerId) => {
    // Cancelling also removes any guest the player added
    const updated = get().trainings.map((t) => {
      if (t.id !== trainingId) return t
      return {
        ...t,
        attendance: t.attendance.filter((id) => id !== playerId),
        guests:     t.guests.filter((g) => g.addedBy !== playerId),
      }
    })
    saveAttendance(Object.fromEntries(updated.map((t) => [t.id, t.attendance])))
    saveGuests(Object.fromEntries(updated.map((t) => [t.id, t.guests])))
    set({ trainings: updated })
  },

  // Each player may add at most one guest. Calling addGuest again replaces the old one.
  addGuest: (trainingId, playerId, name) => {
    const id = `guest-${trainingId}-${playerId}`
    const guest: TrainingGuest = { id, addedBy: playerId, name: name?.trim() || undefined }
    const updated = get().trainings.map((t) => {
      if (t.id !== trainingId) return t
      const others = t.guests.filter((g) => g.addedBy !== playerId)
      return { ...t, guests: [...others, guest] }
    })
    saveGuests(Object.fromEntries(updated.map((t) => [t.id, t.guests])))
    set({ trainings: updated })
  },

  removeGuest: (trainingId, playerId) => {
    const updated = get().trainings.map((t) => {
      if (t.id !== trainingId) return t
      return { ...t, guests: t.guests.filter((g) => g.addedBy !== playerId) }
    })
    saveGuests(Object.fromEntries(updated.map((t) => [t.id, t.guests])))
    set({ trainings: updated })
  },
}))
