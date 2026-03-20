import { NavLink } from 'react-router-dom'
import { Home, Users, Calendar, BarChart2 } from 'lucide-react'

const tabs = [
  { to: '/',          label: 'Hjem',      Icon: Home      },
  { to: '/spillere',  label: 'Spillere',  Icon: Users     },
  { to: '/kampe',     label: 'Kampe',     Icon: Calendar  },
  { to: '/statistik', label: 'Statistik', Icon: BarChart2 },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'var(--bg-nav)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px var(--shadow-nav)',
      }}
    >
      <div className="flex">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
                isActive ? 'text-orange-400' : 'active:text-slate-400'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? undefined : 'var(--text-faint)' })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24)' }}
                  />
                )}
                <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
