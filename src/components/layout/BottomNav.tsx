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
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative select-none"
            style={({ isActive }) => ({
              color: isActive ? 'var(--nav-active-color)' : 'var(--text-faint)',
              /* Colour fades smoothly; transform for tap feedback is set via pointer events */
              transition: 'color 220ms ease',
            })}
          >
            {({ isActive }) => (
              <>
                {/* Indicator bar — always in DOM, animates in when active */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 w-8 h-0.5 rounded-full animate-nav-indicator"
                    style={{ background: 'var(--nav-active-indicator)' }}
                  />
                )}

                {/* Icon — subtle scale + stroke weight shift */}
                <span
                  style={{
                    display: 'flex',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>

                {/* Label — opacity crossfade */}
                <span
                  className="text-[10px] tracking-wide"
                  style={{
                    fontWeight:  isActive ? 600 : 500,
                    opacity:     isActive ? 1 : 0.7,
                    transition:  'opacity 220ms ease, font-weight 0ms',
                  }}
                >
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
