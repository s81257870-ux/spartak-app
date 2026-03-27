import { NavLink } from 'react-router-dom'
import { Home, Users, Calendar, BarChart2, Banknote } from 'lucide-react'

const tabs = [
  { to: '/',           label: 'Hjem',      Icon: Home      },
  { to: '/spillere',   label: 'Spillere',  Icon: Users     },
  { to: '/kampe',      label: 'Kampe',     Icon: Calendar  },
  { to: '/statistik',  label: 'Statistik', Icon: BarChart2 },
  { to: '/boedekasse', label: 'Bøder',     Icon: Banknote  },
]

export default function BottomNav() {
  return (
    <nav
      className="shrink-0 safe-bottom"
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
                isActive ? '' : 'active:text-slate-400'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--nav-active-color)' : 'var(--text-faint)' })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--nav-active-indicator)' }}
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
