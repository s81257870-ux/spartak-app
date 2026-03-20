import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore, type ThemePreference } from '../store/themeStore'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light',  label: 'Lys',    Icon: Sun     },
  { value: 'dark',   label: 'Mørk',   Icon: Moon    },
  { value: 'system', label: 'System', Icon: Monitor },
]

export default function ThemeSwitcher() {
  const { preference, setPreference } = useThemeStore()

  return (
    <div
      className="flex items-center rounded-xl p-1 gap-0.5"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = preference === value
        return (
          <button
            key={value}
            onClick={() => setPreference(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex-1 justify-center"
            style={
              isActive
                ? {
                    background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                    color: '#000',
                    boxShadow: '0 2px 8px rgba(249,115,22,0.30)',
                  }
                : { color: 'var(--text-muted)' }
            }
          >
            <Icon size={11} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
