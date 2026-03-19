import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Match, MatchEvent, PlayerStats } from '../types'
import { SEED_MATCHES } from '../data/seedMatches'
import { DEFAULT_FORMATION } from '../data/formations'

interface MatchStore {
  matches: Match[]
  initialized: boolean
  init: () => void

  // Match CRUD
  addMatch: (match: Omit<Match, 'id' | 'events' | 'lineup' | 'bench' | 'formation' | 'isCompleted'>) => string
  setFormation: (matchId: string, formation: string) => void
  updateMatch: (id: string, updates: Partial<Omit<Match, 'id'>>) => void
  deleteMatch: (id: string) => void
  getMatch: (id: string) => Match | undefined
  completeMatch: (id: string) => void

  // Events
  addEvent: (matchId: string, event: Omit<MatchEvent, 'id'>) => void
  updateEvent: (matchId: string, eventId: string, updates: Partial<Omit<MatchEvent, 'id'>>) => void
  deleteEvent: (matchId: string, eventId: string) => void

  // Lineup (starters + bench)
  setLineupSlot: (matchId: string, position: string, playerId: string) => void
  clearLineupSlot: (matchId: string, position: string) => void
  setBench: (matchId: string, playerIds: string[]) => void
  moveToLineup: (matchId: string, position: string, playerId: string) => void
  moveToBench: (matchId: string, playerId: string) => void
  removeFromSquad: (matchId: string, playerId: string) => void

  // Man of the match
  setManOfTheMatch: (matchId: string, playerId: string | undefined) => void

  // Stats computed across all completed matches
  getPlayerStats: (playerId: string) => PlayerStats
  getAllStats: () => PlayerStats[]
}

export const useMatchStore = create<MatchStore>()(
  persist(
    (set, get) => ({
      matches: [],
      initialized: false,

      init: () => {
        if (get().initialized) return
        set({ matches: SEED_MATCHES, initialized: true })
      },

      addMatch: (match) => {
        const id = `m${Date.now()}`
        const newMatch: Match = {
          ...match,
          id,
          events: [],
          lineup: {},
          bench: [],
          formation: DEFAULT_FORMATION,
          isCompleted: false,
        }
        set((state) => ({ matches: [newMatch, ...state.matches] }))
        return id
      },

      updateMatch: (id, updates) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }))
      },

      deleteMatch: (id) => {
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== id),
        }))
      },

      getMatch: (id) => get().matches.find((m) => m.id === id),

      completeMatch: (id) => {
        get().updateMatch(id, { isCompleted: true })
      },

      addEvent: (matchId, event) => {
        const newEvent: MatchEvent = { ...event, id: `e${Date.now()}` }
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? { ...m, events: [...m.events, newEvent] }
              : m
          ),
        }))
      },

      updateEvent: (matchId, eventId, updates) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m
            const events = m.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
            return { ...m, events }
          }),
        }))
      },

      deleteEvent: (matchId, eventId) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? { ...m, events: m.events.filter((e) => e.id !== eventId) }
              : m
          ),
        }))
      },

      setLineupSlot: (matchId, position, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m
            // Remove player from any other slot first
            const lineup: Record<string, string> = {}
            for (const [pos, pid] of Object.entries(m.lineup)) {
              if (pid !== playerId) lineup[pos] = pid
            }
            lineup[position] = playerId
            return { ...m, lineup }
          }),
        }))
      },

      clearLineupSlot: (matchId, position) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m
            const lineup = { ...m.lineup }
            delete lineup[position]
            return { ...m, lineup }
          }),
        }))
      },

      setBench: (matchId, playerIds) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, bench: playerIds } : m
          ),
        }))
      },

      // Move player to a lineup position (removes from bench if needed)
      moveToLineup: (matchId, position, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m
            // Build new lineup: remove player from other slots, evict previous occupant to bench
            const lineup: Record<string, string> = {}
            let evicted: string | undefined
            for (const [pos, pid] of Object.entries(m.lineup)) {
              if (pid === playerId) continue          // remove player from old slot
              if (pos === position) { evicted = pid; continue } // evict current occupant
              lineup[pos] = pid
            }
            lineup[position] = playerId
            // Bench: remove player, add evicted (if any and not already there)
            let bench = m.bench.filter((id) => id !== playerId)
            if (evicted && !bench.includes(evicted)) bench = [...bench, evicted]
            return { ...m, lineup, bench }
          }),
        }))
      },

      // Move player to bench (removes from lineup if starter)
      moveToBench: (matchId, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m
            const lineup: Record<string, string> = {}
            for (const [pos, pid] of Object.entries(m.lineup)) {
              if (pid !== playerId) lineup[pos] = pid
            }
            const bench = m.bench.includes(playerId) ? m.bench : [...m.bench, playerId]
            return { ...m, lineup, bench }
          }),
        }))
      },

      // Remove player from both lineup and bench (back to "not selected")
      removeFromSquad: (matchId, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m
            const lineup: Record<string, string> = {}
            for (const [pos, pid] of Object.entries(m.lineup)) {
              if (pid !== playerId) lineup[pos] = pid
            }
            const bench = m.bench.filter((id) => id !== playerId)
            return { ...m, lineup, bench }
          }),
        }))
      },

      setFormation: (matchId, formation) => {
        // Changing formation clears the current lineup (slots may be incompatible)
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, formation, lineup: {}, bench: [] } : m
          ),
        }))
      },

      setManOfTheMatch: (matchId, playerId) => {
        get().updateMatch(matchId, { manOfTheMatch: playerId })
      },

      getPlayerStats: (playerId) => {
        const matches = get().matches
        let goals = 0
        let assists = 0
        let matchesPlayed = 0
        let cleanSheets = 0
        let yellowCards = 0
        let redCards = 0

        for (const match of matches) {
          // Count as played if in starting lineup or on bench for a completed match
          if (match.isCompleted) {
            const isInSquad =
              Object.values(match.lineup).includes(playerId) ||
              match.bench.includes(playerId)
            if (isInSquad) matchesPlayed++
          }
          for (const event of match.events) {
            if (event.type === 'goal') {
              if (event.scorerId === playerId) goals++
              if (event.assistId === playerId) assists++
            } else if (event.type === 'yellow-card' && event.scorerId === playerId) {
              yellowCards++
            } else if (event.type === 'red-card' && event.scorerId === playerId) {
              redCards++
            }
          }
          // Clean sheet: GK position in lineup, no goals conceded
          if (match.lineup['MV'] === playerId && match.scoreThem === 0 && match.isCompleted) {
            cleanSheets++
          }
        }

        return { playerId, goals, assists, matchesPlayed, cleanSheets, yellowCards, redCards }
      },

      getAllStats: () => {
        const matches = get().matches
        const playerIds = new Set<string>()

        for (const match of matches) {
          Object.values(match.lineup).forEach((id) => playerIds.add(id))
          match.bench.forEach((id) => playerIds.add(id))
          match.events.forEach((e) => {
            playerIds.add(e.scorerId)
            if (e.assistId) playerIds.add(e.assistId)
          })
        }

        return Array.from(playerIds).map((id) => get().getPlayerStats(id))
      },
    }),
    { name: 'spartak-matches' }
  )
)
