import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import { POSITION_LABELS, type Position } from '../types'

export default function NewPlayer() {
  const navigate  = useNavigate()
  const addPlayer = usePlayerStore((s) => s.addPlayer)

  const [name, setName]         = useState('')
  const [position, setPosition] = useState<Position>('CM')
  const [number, setNumber]     = useState('')
  const [saving, setSaving]     = useState(false)

  const inputStyle = {
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-primary)',
  }

  const submit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await addPlayer({
        name:     name.trim(),
        position,
        number:   number ? parseInt(number) : undefined,
      })
      navigate('/spillere')
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-orange-400 active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ny spiller</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider mb-1.5 block"
                 style={{ color: 'var(--text-secondary)' }}>
            Navn *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Fulde navn"
            autoFocus
            className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/40 placeholder-slate-500"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider mb-1.5 block"
                 style={{ color: 'var(--text-secondary)' }}>
            Position
          </label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/40"
            style={inputStyle}
          >
            {Object.entries(POSITION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider mb-1.5 block"
                 style={{ color: 'var(--text-secondary)' }}>
            Trøjenummer (valgfri)
          </label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="f.eks. 9"
            className="w-full rounded-xl px-4 py-3.5 focus:outline-none focus:border-orange-500/40 placeholder-slate-500"
            style={inputStyle}
          />
        </div>

        <button
          onClick={submit}
          disabled={!name.trim() || saving}
          className="w-full disabled:opacity-40 font-bold py-4 rounded-2xl text-base mt-2 active:scale-[0.98] transition-transform"
          style={{ background: 'var(--cta-bg)', color: 'var(--cta-color)', boxShadow: '0 6px 20px var(--cta-shadow)' }}
        >
          {saving ? 'Gemmer…' : 'Tilføj spiller'}
        </button>
      </div>
    </div>
  )
}
