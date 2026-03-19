import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const ADMIN_USER = 'Admin'
const ADMIN_PASS = 'Admin'

interface AuthState {
  isAdmin: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAdmin: false,

      login: (username, password) => {
        const ok = username === ADMIN_USER && password === ADMIN_PASS
        if (ok) set({ isAdmin: true })
        return ok
      },

      logout: () => set({ isAdmin: false }),
    }),
    { name: 'spartak-auth' }
  )
)
