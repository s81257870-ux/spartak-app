import { create } from 'zustand'
import type { Fine } from '../types'
import {
  fetchFines,
  insertFine,
  insertFines,
  patchFine,
  removeFine,
  subscribeFines,
} from '../lib/supabaseService'

interface FineStore {
  fines: Fine[]
  initialized: boolean
  loading: boolean
  init: () => Promise<void>
  addFine: (fine: Omit<Fine, 'id'>) => Promise<void>
  addFines: (fines: Omit<Fine, 'id'>[]) => Promise<void>
  togglePaid: (id: string) => Promise<void>
  deleteFine: (id: string) => Promise<void>
}

export const useFineStore = create<FineStore>()((set, get) => ({
  fines: [],
  initialized: false,
  loading: false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    try {
      const fines = await fetchFines()
      set({ fines, initialized: true, loading: false })
      // Keep UI in sync with changes from any user/device
      subscribeFines((fines) => set({ fines }))
    } catch (err) {
      console.error('[FineStore] init failed:', err)
      set({ initialized: true, loading: false })
    }
  },

  addFine: async (fine) => {
    try {
      const created = await insertFine(fine)
      // Optimistic: prepend immediately; realtime will confirm
      set((s) => ({ fines: [created, ...s.fines] }))
    } catch (err) {
      console.error('[FineStore] addFine failed:', err)
    }
  },

  addFines: async (fines) => {
    try {
      const created = await insertFines(fines)
      set((s) => ({ fines: [...created, ...s.fines] }))
    } catch (err) {
      console.error('[FineStore] addFines failed:', err)
    }
  },

  togglePaid: async (id) => {
    const fine = get().fines.find((f) => f.id === id)
    if (!fine) return
    const next = !fine.paid
    // Optimistic update
    set((s) => ({ fines: s.fines.map((f) => (f.id === id ? { ...f, paid: next } : f)) }))
    try {
      await patchFine(id, next)
    } catch (err) {
      console.error('[FineStore] togglePaid failed:', err)
      // Revert on failure
      set((s) => ({ fines: s.fines.map((f) => (f.id === id ? { ...f, paid: fine.paid } : f)) }))
    }
  },

  deleteFine: async (id) => {
    const snapshot = get().fines
    // Optimistic remove
    set((s) => ({ fines: s.fines.filter((f) => f.id !== id) }))
    try {
      await removeFine(id)
    } catch (err) {
      console.error('[FineStore] deleteFine failed:', err)
      // Revert on failure
      set({ fines: snapshot })
    }
  },
}))
