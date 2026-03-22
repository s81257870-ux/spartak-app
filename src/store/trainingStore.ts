/**
 * trainingStore — persisted Zustand store for training-session attendance.
 *
 * Sessions are keyed by the Monday's ISO date string ("YYYY-MM-DD") so each
 * calendar week gets its own attendance list without any server-side schema
 * changes.  Data lives in localStorage under 'spartak-training'.
 *
 * Shape:
 *   sessions: {
 *     "2026-03-23": { attendance: ["player-id-1", ...] },
 *     ...
 *   }
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TrainingSession {
  attendance: string[] // playerIds
}

interface TrainingState {
  sessions: Record<string, TrainingSession>
  signUp:       (dateKey: string, playerId: string) => void
  cancelSignUp: (dateKey: string, playerId: string) => void
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set) => ({
      sessions: {},

      signUp: (dateKey, playerId) =>
        set((state) => {
          const session = state.sessions[dateKey] ?? { attendance: [] }
          if (session.attendance.includes(playerId)) return state   // idempotent
          return {
            sessions: {
              ...state.sessions,
              [dateKey]: { attendance: [...session.attendance, playerId] },
            },
          }
        }),

      cancelSignUp: (dateKey, playerId) =>
        set((state) => {
          const session = state.sessions[dateKey]
          if (!session) return state
          return {
            sessions: {
              ...state.sessions,
              [dateKey]: { attendance: session.attendance.filter((id) => id !== playerId) },
            },
          }
        }),
    }),
    { name: 'spartak-training' }
  )
)
