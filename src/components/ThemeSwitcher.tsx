import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

export default function ThemeSwitcher() {
  const { preference, setPreference } = useThemeStore()

  return (
    <div
      className="inline-flex items-center rounded-full p-1"
      style={{ background: 'var(--toggle-track-bg)' }}
    >
      {/* Lys */}
      <button
        onClick={() => setPreference('light')}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
        style={
          preference === 'light'
            ? {
                background: 'var(--toggle-active-bg)',
                color: 'var(--toggle-active-color)',
                boxShadow: `0 2px 10px var(--toggle-active-shadow)`,
              }
            : { color: 'var(--text-muted)' }
        }
      >
        <Sun size={11} />
        Lys
      </button>

      {/* Mørk */}
      <button
        onClick={() => setPreference('dark')}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
        style={
          preference === 'dark'
            ? {
                background: 'var(--toggle-active-bg)',
                color: 'var(--toggle-active-color)',
                boxShadow: `0 2px 10px var(--toggle-active-shadow)`,
              }
            : { color: 'var(--text-muted)' }
        }
      >
        <Moon size={11} />
        Mørk
      </button>
    </div>
  )
}
