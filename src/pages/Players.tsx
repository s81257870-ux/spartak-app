import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import PositionBadge from '../components/players/PositionBadge'

export default function Players() {
  const navigate    = useNavigate()
  const players     = usePlayerStore((s) => s.players)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)
  const isAdmin     = useAuthStore((s) => s.isAdmin)
  const [search, setSearch] = useState('')

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pb-8">

      {/* ── Hero header ───────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-6 overflow-hidden">
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.08) 0%, transparent 70%)' }}
        />
        <div className="flex items-end justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-400 to-amber-500" />
              <span className="text-orange-400/70 text-[10px] font-bold uppercase tracking-[0.15em]">
                Truppen
              </span>
            </div>
            <h1 className="text-[2rem] font-black text-white tracking-tight leading-none">
              Spillere
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/spillere/ny')}
              className="w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-transform text-black shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                boxShadow: '0 6px 20px rgba(249,115,22,0.35)',
              }}
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Search ────────────────────────────────────────── */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Søg spiller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-white/[0.06] rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-orange-500/40 transition-colors"
            style={{ background: '#12131c' }}
          />
        </div>

        {/* ── Count ─────────────────────────────────────────── */}
        <p className="text-slate-600 text-xs font-medium px-0.5">
          {filtered.length} {filtered.length === 1 ? 'spiller' : 'spillere'}
        </p>

        {/* ── Player list ───────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.map((player) => {
            const stats = getPlayerStats(player.id)
            return (
              <button
                key={player.id}
                onClick={() => navigate(`/spillere/${player.id}`)}
                className="w-full rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.98] transition-transform text-left border border-white/[0.05]"
                style={{ background: '#12131c' }}
              >
                <PlayerAvatar name={player.name} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white text-sm">{player.name}</span>
                    <PositionBadge position={player.position} short />
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-slate-500">{stats.matchesPlayed} kampe</span>
                    <span
                      className="font-semibold text-orange-400"
                      style={stats.goals > 0 ? { textShadow: '0 0 10px rgba(249,115,22,0.4)' } : {}}
                    >
                      {stats.goals} mål
                    </span>
                    <span className="text-slate-400 font-medium">{stats.assists} ast</span>
                  </div>
                </div>

                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0 text-slate-700">
                  <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )
          })}
        </div>

        {/* ── Empty state ───────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <p className="text-3xl mb-3">👤</p>
            <p className="text-slate-400 font-medium">Ingen spillere fundet</p>
          </div>
        )}

      </div>
    </div>
  )
}
