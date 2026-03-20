import { create } from 'zustand'

export type ThemePreference = 'light' | 'dark' | 'system'

function resolveApplied(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return pref
}

function applyTheme(pref: ThemePreference) {
  const resolved = resolveApplied(pref)
  document.documentElement.classList.toggle('light', resolved === 'light')
}

const STORAGE_KEY = 'spartak_theme'

interface ThemeStore {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  init: () => () => void   // returns cleanup fn
}

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system',

  setPreference: (preference) => {
    localStorage.setItem(STORAGE_KEY, preference)
    applyTheme(preference)
    set({ preference })
  },

  init: () => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system'
    applyTheme(saved)
    set({ preference: saved })

    // React to OS-level theme changes when preference is 'system'
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system'
      if (current === 'system') applyTheme('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  },
}))
