import { Outlet, useLocation } from 'react-router-dom'
import { usePlayerStore } from '../../store/playerStore'
import AdminBar from './AdminBar'
import BottomNav from './BottomNav'

export default function Layout() {
  const { pathname } = useLocation()

  const myPlayerId = localStorage.getItem('spartak_my_player_id')
  const players    = usePlayerStore((s) => s.players)
  const myPlayer   = players.find((p) => p.id === myPlayerId)

  const showIdentityBar =
    !!myPlayer && (pathname === '/' || pathname.startsWith('/traeninger'))

  const handleSwitch = () => {
    localStorage.removeItem('spartak_my_player_id')
    window.location.reload()
  }

  return (
    <div className="flex flex-col min-h-svh" style={{ background: 'var(--bg-app)' }}>
      <AdminBar />
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Identity strip — above bottom nav on Home and Træninger */}
      {showIdentityBar && (
        <div
          className="fixed left-0 right-0 flex items-center justify-center gap-2 py-1.5 z-40"
          style={{
            bottom:      64,   // sits just above the 64px bottom nav
            background:  'var(--bg-nav)',
            borderTop:   '1px solid var(--border-faint)',
          }}
        >
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Du er logget ind som
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {myPlayer.name.split(' ')[0]}
          </span>
          <button
            onClick={handleSwitch}
            className="text-[10px] underline"
            style={{ color: 'var(--text-faint)' }}
          >
            Skift
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
