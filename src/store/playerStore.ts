import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player } from '../types'
import { SEED_PLAYERS } from '../data/seedData'

interface PlayerStore {
  players: Player[]
  initialized: boolean
  init: () => void
  addPlayer: (player: Omit<Player, 'id'>) => void
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void
  deletePlayer: (id: string) => void
  getPlayer: (id: string) => Player | undefined
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      players: [],
      initialized: false,

      init: () => {
        if (get().initialized) return
        set({ players: SEED_PLAYERS, initialized: true })
      },

      addPlayer: (player) => {
        const newPlayer: Player = {
          ...player,
          id: `p${Date.now()}`,
        }
        set((state) => ({ players: [...state.players, newPlayer] }))
      },

      updatePlayer: (id, updates) => {
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }))
      },

      deletePlayer: (id) => {
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        }))
      },

      getPlayer: (id) => get().players.find((p) => p.id === id),
    }),
    { name: 'spartak-players' }
  )
)
