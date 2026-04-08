import { useState } from 'react'
import { X, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface Props {
  onClose: () => void
}

export default function LoginModal({ onClose }: Props) {
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState(false)

  const submit = () => {
    const ok = login(username.trim(), password)
    if (ok) {
      onClose()
    } else {
      setError(true)
      setPassword('')
    }
  }

  const inputStyle = (hasError: boolean) => ({
    background: 'var(--bg-input)',
    borderColor: hasError ? 'rgba(239,68,68,0.5)' : 'var(--border-input)',
    color: 'var(--text-primary)',
  })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'var(--shadow-modal)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Bottom sheet */}
      <div
        className="w-full rounded-t-3xl px-5 pt-5 pb-10 space-y-4"
        style={{
          background: 'var(--bg-raised)',
          boxShadow: '0 -8px 40px var(--shadow-nav)',
          maxWidth: '480px',
        }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: 'var(--border-input)' }} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--icon-accent-bg)' }}
            >
              <Lock size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>Admin login</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Kun for holdledere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:text-white transition-colors"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl px-4 py-2.5 text-sm text-red-300 border border-red-500/30"
               style={{ background: 'rgba(239,68,68,0.08)' }}>
            Forkert brugernavn eller kode — prøv igen
          </div>
        )}

        {/* Username */}
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
            Brugernavn
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Admin"
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none border transition-colors placeholder-slate-500"
            style={inputStyle(error)}
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--text-secondary)' }}>
            Kodeord
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••"
              className="w-full rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none border transition-colors placeholder-slate-500"
              style={inputStyle(error)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 active:text-slate-300 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!username || !password}
          className="w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-30 active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--cta-bg)',
            color: 'var(--cta-color)',
            boxShadow: '0 6px 20px var(--cta-shadow)',
          }}
        >
          Log ind
        </button>
      </div>
    </div>
  )
}
