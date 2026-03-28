import { create } from 'zustand'
import type { Training } from '../types'

// ── Persistence ────────────────────────────────────────────────────────────────
// Attendance is stored in localStorage so it survives page refreshes without
// requiring a backend. Each trainingId maps to the list of playerIds signed up.

const ATTENDANCE_KEY = 'spartak_training_attendance'

function loadAttendance(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveAttendance(map: Record<string, string[]>) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(map))
}

// ── Session generator ──────────────────────────────────────────────────────────
// Generates the next `count` Monday sessions at 19:30, starting from today
// (Copenhagen timezone). If today is a Monday, it is included.

function generateUpcomingMondays(count: number): Training[] {
  const trainings: Training[] = []

  // Derive today's date in Copenhagen (handles CEST/CET offsets correctly)
  const copenhDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' })
    .format(new Date())
  const [year, month, day] = copenhDate.split('-').map(Number)

  // Work in UTC noon to avoid any DST edge cases during date arithmetic
  const current = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  // Advance to next Monday (day 1). If today is Monday, stay today.
  const dow = current.getUTCDay() // 0=Sun, 1=Mon, …, 6=Sat
  const daysToMonday = dow === 1 ? 0 : (8 - dow) % 7
  current.setUTCDate(current.getUTCDate() + daysToMonday)

  const saved = loadAttendance()

  for (let i = 0; i < count; i++) {
    const dateStr = current.toISOString().slice(0, 10) // 'YYYY-MM-DD'
    const id = `training-${dateStr}`
    trainings.push({
      id,
      date: dateStr,
      time: '19:30',
      location: 'Ryparken Idrætsanlæg',
      cancelled: false,
      attendance: saved[id] ?? [],
    })
    current.setUTCDate(current.getUTCDate() + 7)
  }

  return trainings
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface TrainingStore {
  trainings: Training[]
  signUp:       (trainingId: string, playerId: string) => void
  cancelSignUp: (trainingId: string, playerId: string) => void
}

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  // Initialise with the next 10 Monday sessions on store creation.
  // No async needed — generation is instant and deterministic.
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
    const updated = get().trainings.map((t) => {
      if (t.id !== trainingId) return t
      return { ...t, attendance: t.attendance.filter((id) => id !== playerId) }
    })
    saveAttendance(Object.fromEntries(updated.map((t) => [t.id, t.attendance])))
    set({ trainings: updated })
  },
}))
