import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Fine } from '../types'

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

interface FineStore {
  fines: Fine[]
  /** Add a single fine */
  addFine: (fine: Omit<Fine, 'id'>) => void
  /** Bulk add — used for the "pr. mål" flow */
  addFines: (fines: Omit<Fine, 'id'>[]) => void
  /** Toggle paid ↔ unpaid */
  togglePaid: (id: string) => void
  /** Delete a fine permanently */
  deleteFine: (id: string) => void
}

export const useFineStore = create<FineStore>()(
  persist(
    (set) => ({
      fines: [],

      addFine: (fine) =>
        set((s) => ({ fines: [{ ...fine, id: newId() }, ...s.fines] })),

      addFines: (fines) =>
        set((s) => ({
          fines: [...fines.map((f) => ({ ...f, id: newId() })), ...s.fines],
        })),

      togglePaid: (id) =>
        set((s) => ({
          fines: s.fines.map((f) => (f.id === id ? { ...f, paid: !f.paid } : f)),
        })),

      deleteFine: (id) =>
        set((s) => ({ fines: s.fines.filter((f) => f.id !== id) })),
    }),
    { name: 'spartak-fines' }
  )
)
