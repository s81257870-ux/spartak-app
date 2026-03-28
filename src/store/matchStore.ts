import { create } from 'zustand'
import type { Match, MatchEvent, PlayerStats } from '../types'
import { DEFAULT_FORMATION } from '../data/formations'
import { SEED_MATCHES } from '../data/seedMatches'
import {
  fetchAllMatches,
  insertMatch,
  patchMatch,
  removeMatch,
  insertEvent,
  patchEvent,
  removeEvent,
  syncLineup,
  recalculateMatchScore,
  signUpForMatch,
  cancelSignUpForMatch,
  addStarterForMatch,
  removeStarterForMatch,
} from '../lib/supabaseService'

// ── helper: seed matches to Supabase if table is empty ────────────────────────
async function seedToSupabase(): Promise<Match[]> {
  const results: Match[] = []
  for (const m of SEED_MATCHES) {
    try {
      const created = await insertMatch({
        opponent:      m.opponent,
        date:          m.date,
        location:      m.location,
        scoreUs:       m.scoreUs,
        scoreThem:     m.scoreThem,
        isCompleted:   m.isCompleted,
        formation:     m.formation,
        manOfTheMatch: m.manOfTheMatch,
      })
      results.push(created)
    } catch {
      // ignore individual failures
    }
  }
  return results
}

// ── store ─────────────────────────────────────────────────────────────────────

interface MatchStore {
  matches: Match[]
  loading: boolean
  initialized: boolean
  init: () => Promise<void>

  // CRUD
  addMatch: (match: Omit<Match, 'id' | 'events' | 'lineup' | 'bench' | 'formation' | 'isCompleted' | 'attendance' | 'starters'>) => Promise<string>
  updateMatch: (id: string, updates: Partial<Omit<Match, 'id'>>) => void
  deleteMatch: (id: string) => void
  getMatch: (id: string) => Match | undefined
  completeMatch: (id: string) => void
  setFormation: (matchId: string, formation: string) => void

  // Events
  addEvent: (matchId: string, event: Omit<MatchEvent, 'id'>) => Promise<void>
  updateEvent: (matchId: string, eventId: string, updates: Partial<Omit<MatchEvent, 'id'>>) => void
  deleteEvent: (matchId: string, eventId: string) => void

  // Lineup
  moveToLineup: (matchId: string, position: string, playerId: string) => void
  moveToBench: (matchId: string, playerId: string) => void
  removeFromSquad: (matchId: string, playerId: string) => void
  setLineupSlot: (matchId: string, position: string, playerId: string) => void
  clearLineupSlot: (matchId: string, position: string) => void
  setBench: (matchId: string, playerIds: string[]) => void

  // Man of the match
  setManOfTheMatch: (matchId: string, playerId: string | undefined) => void

  // Attendance
  signUp: (matchId: string, playerId: string) => void
  cancelSignUp: (matchId: string, playerId: string) => void

  // Startopstilling (up to 7 from attendance)
  addStarter: (matchId: string, playerId: string) => void
  removeStarter: (matchId: string, playerId: string) => void

  // Live score initialization
  initializeLiveScore: (matchId: string) => void

  // Realtime callbacks (called by useRealtimeMatch hook)
  setMatchEvents: (matchId: string, events: MatchEvent[]) => void
  setMatchLineup: (matchId: string, lineup: Record<string, string>, bench: string[]) => void
  applyMatchPatch: (matchId: string, updates: Partial<Match>) => void

  // Stats
  getPlayerStats: (playerId: string) => PlayerStats
  getAllStats: () => PlayerStats[]
}

export const useMatchStore = create<MatchStore>()((set, get) => ({
  matches: [],
  loading: false,
  initialized: false,

  // ── Init ──────────────────────────────────────────────────────────────────
  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      let matches = await fetchAllMatches()
      if (matches.length === 0) {
        matches = await seedToSupabase()
      }
      set({ matches, initialized: true, loading: false })
    } catch (err) {
      console.error('[MatchStore] Supabase fetch failed, using seed data:', err)
      set({ matches: SEED_MATCHES, initialized: true, loading: false })
    }
  },

  // ── Match CRUD ────────────────────────────────────────────────────────────
  addMatch: async (match) => {
    const created = await insertMatch({
      ...match,
      formation:    DEFAULT_FORMATION,
      isCompleted:  false,
      manOfTheMatch: undefined,
    })
    set((s) => ({ matches: [created, ...s.matches] }))
    return created.id
  },

  updateMatch: (id, updates) => {
    set((s) => ({
      matches: s.matches.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
    patchMatch(id, updates).catch((err) =>
      console.error('[MatchStore] Failed to update match:', err)
    )
  },

  deleteMatch: (id) => {
    set((s) => ({ matches: s.matches.filter((m) => m.id !== id) }))
    removeMatch(id).catch((err) =>
      console.error('[MatchStore] Failed to delete match:', err)
    )
  },

  getMatch: (id) => get().matches.find((m) => m.id === id),

  completeMatch: (id) => get().updateMatch(id, { isCompleted: true }),

  setFormation: (matchId, formation) => {
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, formation, lineup: {}, bench: [] } : m
      ),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) {
      patchMatch(matchId, { formation }).catch(console.error)
      syncLineup(matchId, {}, []).catch(console.error)
    }
  },

  // ── Events ────────────────────────────────────────────────────────────────
  addEvent: async (matchId, event) => {
    const created = await insertEvent(matchId, event)
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, events: [...m.events, created] } : m
      ),
    }))
    if (event.type === 'goal') {
      recalculateMatchScore(matchId)
        .then(({ scoreUs, scoreThem }) =>
          set((s) => ({
            matches: s.matches.map((m) =>
              m.id === matchId ? { ...m, scoreUs, scoreThem } : m
            ),
          }))
        )
        .catch((err) => console.error('[MatchStore] Score recalculation failed:', err))
    }
  },

  updateEvent: (matchId, eventId, updates) => {
    const match = get().matches.find((m) => m.id === matchId)
    const prevEvent = match?.events.find((e) => e.id === eventId)
    const wasGoal = prevEvent?.type === 'goal'
    const isGoal = updates.type ? updates.type === 'goal' : wasGoal

    set((s) => ({
      matches: s.matches.map((m) => {
        if (m.id !== matchId) return m
        return { ...m, events: m.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)) }
      }),
    }))

    const sync = async () => {
      await patchEvent(eventId, updates)
      if (wasGoal || isGoal) {
        const { scoreUs, scoreThem } = await recalculateMatchScore(matchId)
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === matchId ? { ...m, scoreUs, scoreThem } : m
          ),
        }))
      }
    }
    sync().catch((err) => console.error('[MatchStore] Failed to update event:', err))
  },

  deleteEvent: (matchId, eventId) => {
    const match = get().matches.find((m) => m.id === matchId)
    const event = match?.events.find((e) => e.id === eventId)
    const wasGoal = event?.type === 'goal'

    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId
          ? { ...m, events: m.events.filter((e) => e.id !== eventId) }
          : m
      ),
    }))

    const cleanup = async () => {
      await removeEvent(eventId)
      if (wasGoal) {
        const { scoreUs, scoreThem } = await recalculateMatchScore(matchId)
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === matchId ? { ...m, scoreUs, scoreThem } : m
          ),
        }))
      }
    }
    cleanup().catch((err) => console.error('[MatchStore] Failed to delete event:', err))
  },

  // ── Lineup ────────────────────────────────────────────────────────────────
  moveToLineup: (matchId, position, playerId) => {
    set((s) => ({
      matches: s.matches.map((m) => {
        if (m.id !== matchId) return m
        const lineup: Record<string, string> = {}
        let evicted: string | undefined
        for (const [pos, pid] of Object.entries(m.lineup)) {
          if (pid === playerId) continue
          if (pos === position) { evicted = pid; continue }
          lineup[pos] = pid
        }
        lineup[position] = playerId
        let bench = m.bench.filter((id) => id !== playerId)
        if (evicted && !bench.includes(evicted)) bench = [...bench, evicted]
        return { ...m, lineup, bench }
      }),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) syncLineup(matchId, m.lineup, m.bench).catch(console.error)
  },

  moveToBench: (matchId, playerId) => {
    set((s) => ({
      matches: s.matches.map((m) => {
        if (m.id !== matchId) return m
        const lineup: Record<string, string> = {}
        for (const [pos, pid] of Object.entries(m.lineup)) {
          if (pid !== playerId) lineup[pos] = pid
        }
        const bench = m.bench.includes(playerId) ? m.bench : [...m.bench, playerId]
        return { ...m, lineup, bench }
      }),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) syncLineup(matchId, m.lineup, m.bench).catch(console.error)
  },

  removeFromSquad: (matchId, playerId) => {
    set((s) => ({
      matches: s.matches.map((m) => {
        if (m.id !== matchId) return m
        const lineup: Record<string, string> = {}
        for (const [pos, pid] of Object.entries(m.lineup)) {
          if (pid !== playerId) lineup[pos] = pid
        }
        const bench = m.bench.filter((id) => id !== playerId)
        return { ...m, lineup, bench }
      }),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) syncLineup(matchId, m.lineup, m.bench).catch(console.error)
  },

  setLineupSlot: (matchId, position, playerId) => {
    set((s) => ({
      matches: s.matches.map((m) => {
        if (m.id !== matchId) return m
        const lineup: Record<string, string> = {}
        for (const [pos, pid] of Object.entries(m.lineup)) {
          if (pid !== playerId) lineup[pos] = pid
        }
        lineup[position] = playerId
        return { ...m, lineup }
      }),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) syncLineup(matchId, m.lineup, m.bench).catch(console.error)
  },

  clearLineupSlot: (matchId, position) => {
    set((s) => ({
      matches: s.matches.map((m) => {
        if (m.id !== matchId) return m
        const lineup = { ...m.lineup }
        delete lineup[position]
        return { ...m, lineup }
      }),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) syncLineup(matchId, m.lineup, m.bench).catch(console.error)
  },

  setBench: (matchId, playerIds) => {
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, bench: playerIds } : m
      ),
    }))
    const m = get().matches.find((x) => x.id === matchId)
    if (m) syncLineup(matchId, m.lineup, playerIds).catch(console.error)
  },

  setManOfTheMatch: (matchId, playerId) => {
    get().updateMatch(matchId, { manOfTheMatch: playerId })
  },

  // ── Live score initialization ──────────────────────────────────────────────
  initializeLiveScore: (matchId) => {
    const match = get().matches.find((m) => m.id === matchId)
    // Only initialize when both scores are still at the default 0 and no
    // goals have been recorded — avoids overwriting real data if the admin
    // has already entered goals.
    if (!match) return
    const hasGoalEvents = match.events.some((e) => e.type === 'goal')
    if (hasGoalEvents) return
    if (match.scoreUs === 0 && match.scoreThem === 0) return  // already at 0–0, nothing to do
    // If for some reason scores are undefined/null (edge case), set them to 0
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId
          ? { ...m, scoreUs: m.scoreUs ?? 0, scoreThem: m.scoreThem ?? 0 }
          : m
      ),
    }))
    patchMatch(matchId, { scoreUs: 0, scoreThem: 0 }).catch((err) =>
      console.error('[MatchStore] initializeLiveScore failed:', err)
    )
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  signUp: (matchId, playerId) => {
    const match = get().matches.find((m) => m.id === matchId)
    if (!match || match.attendance.includes(playerId)) return
    const updated = [...match.attendance, playerId]
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, attendance: updated } : m
      ),
    }))
    signUpForMatch(matchId, playerId, match.attendance).catch((err) =>
      console.error('[MatchStore] Sign up failed:', err)
    )
  },

  cancelSignUp: (matchId, playerId) => {
    const match = get().matches.find((m) => m.id === matchId)
    if (!match) return
    const updated = match.attendance.filter((id) => id !== playerId)
    // Also remove from starters if present (keep starters consistent with attendance)
    const updatedStarters = (match.starters ?? []).filter((id) => id !== playerId)
    // Also remove from lineup and bench (keep formation builder consistent with attendance)
    const updatedLineup: Record<string, string> = {}
    for (const [pos, pid] of Object.entries(match.lineup)) {
      if (pid !== playerId) updatedLineup[pos] = pid
    }
    const updatedBench = match.bench.filter((id) => id !== playerId)
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId
          ? { ...m, attendance: updated, starters: updatedStarters, lineup: updatedLineup, bench: updatedBench }
          : m
      ),
    }))
    cancelSignUpForMatch(matchId, playerId, match.attendance).catch((err) =>
      console.error('[MatchStore] Cancel sign up failed:', err)
    )
    if ((match.starters ?? []).includes(playerId)) {
      removeStarterForMatch(matchId, playerId, match.starters ?? []).catch((err) =>
        console.error('[MatchStore] Remove starter on cancel failed:', err)
      )
    }
    const lineupChanged = Object.values(match.lineup).includes(playerId) || match.bench.includes(playerId)
    if (lineupChanged) {
      syncLineup(matchId, updatedLineup, updatedBench).catch((err) =>
        console.error('[MatchStore] Sync lineup on cancel failed:', err)
      )
    }
  },

  // ── Startopstilling ───────────────────────────────────────────────────────
  addStarter: (matchId, playerId) => {
    const match = get().matches.find((m) => m.id === matchId)
    if (!match) return
    const starters = match.starters ?? []
    if (starters.includes(playerId) || starters.length >= 7) return
    const updated = [...starters, playerId]
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, starters: updated } : m
      ),
    }))
    addStarterForMatch(matchId, playerId, starters).catch((err) =>
      console.error('[MatchStore] Add starter failed:', err)
    )
  },

  removeStarter: (matchId, playerId) => {
    const match = get().matches.find((m) => m.id === matchId)
    if (!match) return
    const starters = match.starters ?? []
    const updated = starters.filter((id) => id !== playerId)
    set((s) => ({
      matches: s.matches.map((m) =>
        m.id === matchId ? { ...m, starters: updated } : m
      ),
    }))
    removeStarterForMatch(matchId, playerId, starters).catch((err) =>
      console.error('[MatchStore] Remove starter failed:', err)
    )
  },

  // ── Realtime callbacks ────────────────────────────────────────────────────
  setMatchEvents: (matchId, events) => {
    set((s) => ({
      matches: s.matches.map((m) => (m.id === matchId ? { ...m, events } : m)),
    }))
  },

  setMatchLineup: (matchId, lineup, bench) => {
    set((s) => ({
      matches: s.matches.map((m) => (m.id === matchId ? { ...m, lineup, bench } : m)),
    }))
  },

  applyMatchPatch: (matchId, updates) => {
    set((s) => ({
      matches: s.matches.map((m) => (m.id === matchId ? { ...m, ...updates } : m)),
    }))
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  getPlayerStats: (playerId) => {
    const matches = get().matches
    let goals = 0, assists = 0, matchesPlayed = 0, cleanSheets = 0
    let yellowCards = 0, redCards = 0

    for (const match of matches) {
      if (match.isCompleted) {
        const inSquad =
          Object.values(match.lineup).includes(playerId) ||
          match.bench.includes(playerId)
        if (inSquad) matchesPlayed++
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
      if (match.lineup['MV'] === playerId && match.scoreThem === 0 && match.isCompleted) {
        cleanSheets++
      }
    }
    return { playerId, goals, assists, matchesPlayed, cleanSheets, yellowCards, redCards }
  },

  getAllStats: () => {
    const ids = new Set<string>()
    for (const m of get().matches) {
      Object.values(m.lineup).forEach((id) => ids.add(id))
      m.bench.forEach((id) => ids.add(id))
      m.events.forEach((e) => {
        ids.add(e.scorerId)
        if (e.assistId) ids.add(e.assistId)
      })
    }
    return Array.from(ids).map((id) => get().getPlayerStats(id))
  },
}))
