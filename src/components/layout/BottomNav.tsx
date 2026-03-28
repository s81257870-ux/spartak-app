import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Volleyball, BarChart2, Banknote } from 'lucide-react'

const tabs = [
  { to: '/',            label: 'Hjem',       Icon: Home,       end: true  },
  { to: '/kampe',       label: 'Kampe',      Icon: Calendar,   end: false },
  { to: '/traeninger',  label: 'Træninger',  Icon: Volleyball, end: false },
  { to: '/statistik',   label: 'Statistik',  Icon: BarChart2, end: false },
  { to: '/boedekasse',  label: 'Bøder',      Icon: Banknote,  end: false },
]

const N      = tabs.length          // 5
const TAB_VW = 100 / N             // 20 — each tab occupies 20vw (nav = 100vw)
const IND_W  = 28                  // indicator width in px

/**
 * Derive active tab index directly from the current pathname.
 * Avoids an extra useState — index is recalculated synchronously on render.
 */
function useActiveTabIndex(): number {
  const { pathname } = useLocation()
  const idx = tabs.findIndex(({ to, end }) =>
    end ? pathname === to : pathname.startsWith(to)
  )
  return idx === -1 ? 0 : idx
}

export default function BottomNav() {
  const activeIndex = useActiveTabIndex()

  /**
   * Indicator translateX:
   *   centre of tab[i] = (i * TAB_VW + TAB_VW/2)vw
   *   shift left by half the indicator width so it's centred under the icon
   *
   * Using vw (not %) because % in translateX is relative to the element's own
   * width (28px), not the nav container. The nav is always 100vw on this app.
   */
  const indicatorX = `calc(${activeIndex * TAB_VW + TAB_VW / 2}vw - ${IND_W / 2}px)`

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'var(--bg-nav)',
        borderTop:  '1px solid var(--border)',
        boxShadow:  '0 -4px 20px var(--shadow-nav)',
      }}
    >
      {/* ── Sliding indicator ────────────────────────────────────────────
          Single element shared across all tabs.
          Moves via GPU-composited translateX; no layout triggered.
          willChange hints the browser to promote this layer ahead of time.
      ─────────────────────────────────────────────────────────────────── */}
      <span
        aria-hidden
        style={{
          position:      'absolute',
          top:           0,
          left:          0,
          width:         IND_W,
          height:        2,
          borderRadius:  9999,
          background:    'var(--nav-active-indicator)',
          transform:     `translateX(${indicatorX})`,
          transition:    'transform 230ms cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: 'none',
          willChange:    'transform',
        }}
      />

      <div className="flex">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative select-none"
            style={({ isActive }) => ({
              color:      isActive ? 'var(--nav-active-color)' : 'var(--text-faint)',
              transition: 'color 200ms ease',
            })}
            /* ── Press feedback ──────────────────────────────────────────
               Fast scale-down (60ms) on touch — user feels the tap before
               navigation fires. Snap back with ease-out (200ms).
               No navigation delay: pointer events fire before click.
            ────────────────────────────────────────────────────────────── */
            onPointerDown={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform  = 'scale(0.93)'
              el.style.transition = 'transform 60ms ease-out'
            }}
            onPointerUp={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform  = 'scale(1)'
              el.style.transition = 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
            onPointerLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.transform  = 'scale(1)'
              el.style.transition = 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            {({ isActive }) => (
              <>
                {/* Icon — scale up when active; stroke weight reinforces state */}
                <span
                  style={{
                    display:    'flex',
                    transform:  isActive ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 230ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>

                {/* Label — active is full weight + opacity; inactive clearly recedes */}
                <span
                  className="text-[10px] tracking-wide"
                  style={{
                    fontWeight:  isActive ? 600 : 400,
                    opacity:     isActive ? 1 : 0.5,
                    transition:  'opacity 200ms ease',
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
