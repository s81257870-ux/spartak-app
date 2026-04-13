import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Flame, CalendarCheck, Star, User } from 'lucide-react'
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

  const matches = useMatchStore((s) => s.matches)

  // Completed matches sorted oldest→newest for streak calculation
  const completedByDate = useMemo(
    () => [...matches.filter((m) => m.isCompleted)].sort((a, b) => a.date.localeCompare(b.date)),
    [matches]
  )

  /** Goals in consecutive completed matches ending at the most recent. */
  const goalStreak = (playerId: string): number => {
    let n = 0
    for (let i = completedByDate.length - 1; i >= 0; i--) {
      const m = completedByDate[i]
      const scored = m.events.some(
        (e) => e.type === 'goal' && e.team !== 'them' && e.scorerId === playerId
      )
      if (scored) n++
      else break
    }
    return n
  }

  /** Attended consecutive completed matches ending at the most recent. */
  const attendanceStreak = (playerId: string): number => {
    let n = 0
    for (let i = completedByDate.length - 1; i >= 0; i--) {
      const m = completedByDate[i]
      const attended =
        m.attendance.includes(playerId) ||
        Object.values(m.lineup).includes(playerId) ||
        m.bench.includes(playerId)
      if (attended) n++
      else break
    }
    return n
  }

  /** Times the player won Man of the Match. */
  const motmCount = (playerId: string): number =>
    completedByDate.filter((m) => m.manOfTheMatch === playerId).length

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pb-8">

      {/* ── Hero header ───────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-6 overflow-hidden">
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)' }}
        />
        <div className="flex items-end justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-4 rounded-full" style={{ background: 'var(--section-bar-bg)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: 'var(--section-label-color)' }}>
                Truppen
              </span>
            </div>
            <h1 className="text-[2rem] font-black tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}>
              Spillere
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/spillere/ny')}
              className="w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
              style={{
                background: 'var(--cta-bg)',
                color: 'var(--cta-color)',
                boxShadow: '0 6px 20px var(--cta-shadow)',
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
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Søg spiller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500/40 transition-colors placeholder-slate-500"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* ── Count ─────────────────────────────────────────── */}
        <p className="text-xs font-medium px-0.5" style={{ color: 'var(--text-faint)' }}>
          {filtered.length} {filtered.length === 1 ? 'spiller' : 'spillere'}
        </p>

        {/* ── Player list ───────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.map((player) => {
            const stats = getPlayerStats(player.id)
            const gStreak   = goalStreak(player.id)
            const aStreak   = attendanceStreak(player.id)
            const motm      = motmCount(player.id)
            const hasBadges = gStreak >= 2 || aStreak >= 4 || motm > 0
            return (
              <button
                key={player.id}
                onClick={() => navigate(`/spillere/${player.id}`)}
                className="w-full rounded-2xl p-4 flex items-center gap-3.5 active:scale-[0.98] transition-transform text-left"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}
              >
                <PlayerAvatar name={player.name} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {player.name}
                    </span>
                    <PositionBadge position={player.position} short />
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{stats.matchesPlayed} kampe</span>
                    <span
                      className="font-semibold"
                      style={{
                        color: stats.goals > 0 ? 'var(--accent)' : 'var(--text-muted)',
                        textShadow: stats.goals > 0 ? '0 0 10px rgba(229,62,62,0.30)' : 'none',
                      }}
                    >
                      {stats.goals} mål
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {stats.assists} ast
                    </span>
                  </div>
                  {hasBadges && (
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {gStreak >= 2 && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(249,115,22,0.12)',
                            color: '#f97316',
                            border: '1px solid rgba(249,115,22,0.22)',
                          }}
                        >
                          <Flame size={9} strokeWidth={2.5} />
                          {gStreak} i træk
                        </span>
                      )}
                      {aStreak >= 4 && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'var(--icon-accent-bg)',
                            color: 'var(--accent)',
                            border: '1px solid var(--badge-accent-border)',
                          }}
                        >
                          <CalendarCheck size={9} strokeWidth={2.5} />
                          {aStreak} mødt op
                        </span>
                      )}
                      {motm > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(234,179,8,0.11)',
                            color: '#eab308',
                            border: '1px solid rgba(234,179,8,0.22)',
                          }}
                        >
                          <Star size={9} strokeWidth={2.5} />
                          MOTM ×{motm}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0"
                     style={{ color: 'var(--text-dimmer)' }}>
                  <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )
          })}
        </div>

        {/* ── Empty state ───────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-faint)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                 style={{ background: 'var(--bg-raised)', color: 'var(--text-faint)' }}>
              <User size={26} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Ingen spillere fundet</p>
          </div>
        )}

      </div>
    </div>
  )
}
