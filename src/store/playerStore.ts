import { create } from 'zustand'
import type { Player } from '../types'
import { fetchPlayers, insertPlayer, patchPlayer, removePlayer } from '../lib/supabaseService'
import { SEED_PLAYERS } from '../data/seedData'

interface PlayerStore {
  players: Player[]
  loading: boolean
  initialized: boolean
  init: () => Promise<void>
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void
  deletePlayer: (id: string) => void
  getPlayer: (id: string) => Player | undefined
}

export const usePlayerStore = create<PlayerStore>()((set, get) => ({
  players: [],
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const players = await fetchPlayers()
      set({ players, initialized: true, loading: false })
    } catch (err) {
      console.error('[PlayerStore] Supabase fetch failed, using seed data:', err)
      set({ players: SEED_PLAYERS, initialized: true, loading: false })
    }
  },

  addPlayer: async (player) => {
    try {
      const created = await insertPlayer(player)
      set((s) => ({ players: [...s.players, created] }))
    } catch (err) {
      console.error('[PlayerStore] Failed to create player:', err)
      throw err
    }
  },

  updatePlayer: (id, updates) => {
    // Optimistic
    set((s) => ({
      players: s.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
    patchPlayer(id, updates).catch((err) =>
      console.error('[PlayerStore] Failed to update player:', err)
    )
  },

  deletePlayer: (id) => {
    // Optimistic
    set((s) => ({ players: s.players.filter((p) => p.id !== id) }))
    removePlayer(id).catch((err) =>
      console.error('[PlayerStore] Failed to delete player:', err)
    )
  },

  getPlayer: (id) => get().players.find((p) => p.id === id),
}))
