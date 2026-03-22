/**
 * trainingStore — persisted Zustand store for training-session attendance.
 *
 * Sessions are keyed by the Monday's ISO date string ("YYYY-MM-DD").
 * Each session tracks two separate lists:
 *
 *   attendance  – real playerIds (from the players roster)
 *   guests      – guest slot ids: "guest-1" … "guest-5"
 *
 * Guests are training-only; they never appear in player stats or match data.
 * Total headcount for the "Træning er på" threshold = attendance + guests.
 *
 * Data lives in localStorage under 'spartak-training'.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Fixed guest slots — training-only, not real players.
export const TRAINING_GUESTS = [
  { id: 'guest-1', label: 'Gæst 1' },
  { id: 'guest-2', label: 'Gæst 2' },
  { id: 'guest-3', label: 'Gæst 3' },
  { id: 'guest-4', label: 'Gæst 4' },
  { id: 'guest-5', label: 'Gæst 5' },
] as const

export type GuestId = (typeof TRAINING_GUESTS)[number]['id']

export interface TrainingSession {
  attendance: string[]   // real playerIds
  guests:     GuestId[]  // active guest slot ids
}

interface TrainingState {
  sessions: Record<string, TrainingSession>

  // Real-player actions
  signUp:       (dateKey: string, playerId: string) => void
  cancelSignUp: (dateKey: string, playerId: string) => void

  // Guest actions
  addGuest:    (dateKey: string, guestId: GuestId) => void
  removeGuest: (dateKey: string, guestId: GuestId) => void
}

/** Returns a session for the given key, defaulting both arrays to empty. */
function getSession(sessions: Record<string, TrainingSession>, dateKey: string): TrainingSession {
  return sessions[dateKey] ?? { attendance: [], guests: [] }
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set) => ({
      sessions: {},

      signUp: (dateKey, playerId) =>
        set((s) => {
          const session = getSession(s.sessions, dateKey)
          if (session.attendance.includes(playerId)) return s  // idempotent
          return {
            sessions: {
              ...s.sessions,
              [dateKey]: { ...session, attendance: [...session.attendance, playerId] },
            },
          }
        }),

      cancelSignUp: (dateKey, playerId) =>
        set((s) => {
          const session = getSession(s.sessions, dateKey)
          return {
            sessions: {
              ...s.sessions,
              [dateKey]: { ...session, attendance: session.attendance.filter((id) => id !== playerId) },
            },
          }
        }),

      addGuest: (dateKey, guestId) =>
        set((s) => {
          const session = getSession(s.sessions, dateKey)
          if (session.guests.includes(guestId)) return s        // idempotent
          return {
            sessions: {
              ...s.sessions,
              [dateKey]: { ...session, guests: [...session.guests, guestId] },
            },
          }
        }),

      removeGuest: (dateKey, guestId) =>
        set((s) => {
          const session = getSession(s.sessions, dateKey)
          return {
            sessions: {
              ...s.sessions,
              [dateKey]: { ...session, guests: session.guests.filter((id) => id !== guestId) },
            },
          }
        }),
    }),
    { name: 'spartak-training' }
  )
)
