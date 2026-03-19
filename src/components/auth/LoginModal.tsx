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
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState(false)

  const submit = () => {
    const ok = login(username.trim(), password)
    if (ok) {
      onClose()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Bottom sheet */}
      <div
        className="w-full rounded-t-3xl px-5 pt-5 pb-10 space-y-4"
        style={{
          background: '#1a1d27',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          maxWidth: '480px',
        }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <Lock size={16} className="text-orange-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Admin login</p>
              <p className="text-slate-500 text-[11px]">Kun for holdledere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 active:text-white"
            style={{ background: 'rgba(255,255,255,0.06)' }}
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
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">Brugernavn</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Admin"
            className="w-full rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none border transition-colors"
            style={{
              background: '#0f1117',
              borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
            }}
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">Kodeord</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••"
              className="w-full rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 text-sm focus:outline-none border transition-colors"
              style={{
                background: '#0f1117',
                borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 active:text-slate-300"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!username || !password}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-black disabled:opacity-30 active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
            boxShadow: '0 6px 20px rgba(249,115,22,0.28)',
          }}
        >
          Log ind
        </button>
      </div>
    </div>
  )
}
