import { useState } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import LoginModal from '../auth/LoginModal'

export default function AdminBar() {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const logout  = useAuthStore((s) => s.logout)
  const [showLogin, setShowLogin] = useState(false)

  if (!isAdmin) return null

  return (
    <>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <div
        className="flex items-center justify-between px-4 py-1.5"
        style={{
          background:   'rgba(220,38,38,0.08)',
          borderBottom: '1px solid rgba(220,38,38,0.18)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} style={{ color: 'var(--accent)' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            Admin tilstand aktiv
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-[10px] active:opacity-60"
          style={{ color: 'var(--text-faint)' }}
        >
          <LogOut size={10} />
          Log ud
        </button>
      </div>
    </>
  )
}
