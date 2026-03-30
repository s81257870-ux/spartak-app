import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Home, Plane, Radio, Building2, Goal, Users } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'
import { isMatchLive, isMatchCompleted } from '../utils/matchTime'
import PageHeader from '../components/layout/PageHeader'
import { fmtMatchList } from '../utils/dateFormat'


/** Ryparken is our home ground — any other location is away. */
const HOME_VENUE = 'ryparken'
const isHomeGame = (location: string | null) => (location ?? '').toLowerCase().includes(HOME_VENUE)


/**
 * Returns a ticker value that increments every 60 seconds.
 * Components that depend on live state can include this in their deps to
 * automatically re-evaluate isMatchLive / isMatchCompleted.
 */
function useLiveTicker(): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])
  return tick
}

export default function Matches() {
  const navigate = useNavigate()
  const matches  = useMatchStore((s) => s.matches)
  const isAdmin  = useAuthStore((s) => s.isAdmin)
  const tick     = useLiveTicker()   // causes re-render every 60 s for live detection

  // Suppress unused-variable warning — tick is intentionally read to force updates
  void tick

  const upcoming  = matches.filter((m) => !m.isCompleted)
  const completed = matches.filter((m) => m.isCompleted)

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
            <PageHeader label="Kampprogram" title="Kampe" />
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/kampe/ny')}
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

      {/* ── Empty state ───────────────────────────────────── */}
      {matches.length === 0 && (
        <div className="text-center py-20 px-4" style={{ color: 'var(--text-faint)' }}>
          <div
            className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
            style={{ width: 52, height: 52, background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}
          >
            <Building2 size={26} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Ingen kampe endnu</p>
          <p className="text-sm mt-1">Tryk + for at oprette en kamp</p>
        </div>
      )}

      <div className="px-4 space-y-6">

        {/* ── Upcoming matches ──────────────────────────────── */}
        {upcoming.length > 0 && (
          <section>
            <SectionLabel>Kommende · {upcoming.length}</SectionLabel>
            <div className="space-y-2.5">
              {upcoming.map((match, idx) => {
                const isNext  = idx === 0
                const home    = isHomeGame(match.location)
                const live    = isMatchLive(match)
                const completed = isMatchCompleted(match)
                return (
                <button
                  key={match.id}
                  onClick={() => navigate(`/kampe/${match.id}`)}
                  className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform relative overflow-hidden"
                  style={{
                    background: live && !completed
                      ? `linear-gradient(135deg, rgba(239,68,68,0.08) 0%, var(--bg-card) 65%)`
                      : isNext
                        ? `linear-gradient(135deg, rgba(149,197,233,0.10) 0%, var(--bg-card) 65%)`
                        : `linear-gradient(135deg, var(--accent-card-tint) 0%, var(--bg-card) 70%)`,
                    border: live && !completed
                      ? '1px solid rgba(239,68,68,0.25)'
                      : isNext
                        ? '1px solid rgba(149,197,233,0.28)'
                        : '1px solid var(--accent-card-border)',
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                    style={{
                      background: live && !completed
                        ? '#ef4444'
                        : isNext ? 'var(--accent)' : 'var(--accent-stripe)',
                    }}
                  />
                  <div className="pl-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {/* Home / Away badge */}
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
                          style={home
                            ? { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.22)' }
                            : { background: 'var(--icon-accent-bg)', color: 'var(--accent)', border: '1px solid var(--badge-accent-border)' }
                          }
                        >
                          {home ? <Home size={8} /> : <Plane size={8} />}
                          {home ? 'Hjemme' : 'Ude'}
                        </span>
                      </div>
                      <p
                        className="font-bold text-base truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        vs. {match.opponent}
                      </p>
                      <p className="text-xs mt-0.5 flex items-center gap-1"
                         style={{ color: 'var(--text-muted)' }}>
                        <MapPin size={10} className="shrink-0" />
                        {match.location} · {formatShortDate(match.date)}
                      </p>
                    </div>

                    {/* Right-side badge */}
                    {live && !completed ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 animate-pulse"
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.30)',
                        }}
                      >
                        <Radio size={9} />
                        LIVE {match.scoreUs}–{match.scoreThem}
                      </span>
                    ) : isNext ? (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: 'var(--accent)', color: '#0b1220' }}
                      >
                        Næste
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          background: 'var(--badge-accent-bg)',
                          color: 'var(--badge-accent-text)',
                          border: '1px solid var(--badge-accent-border)',
                        }}
                      >
                        Kommende
                      </span>
                    )}
                  </div>
                </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Completed matches ─────────────────────────────── */}
        {completed.length > 0 && (
          <section>
            <SectionLabel>Afsluttede · {completed.length}</SectionLabel>
            <div className="space-y-2">
              {completed.map((match) => {
                const won  = match.scoreUs > match.scoreThem
                const draw = match.scoreUs === match.scoreThem
                const resultLabel = won ? 'Sejr' : draw ? 'Uafgjort' : 'Nederlag'
                const resultColor = won ? '#4ade80' : draw ? '#facc15' : '#f87171'
                const resultBg    = won ? 'rgba(74,222,128,0.10)' : draw ? 'rgba(250,204,21,0.10)' : 'rgba(248,113,113,0.10)'

                return (
                  <button
                    key={match.id}
                    onClick={() => navigate(`/kampe/${match.id}`)}
                    className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Result indicator */}
                      <div
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ background: resultColor, minHeight: '36px' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          vs. {match.opponent}
                        </p>
                        <p className="text-xs mt-0.5 flex items-center gap-1"
                           style={{ color: 'var(--text-faint)' }}>
                          <MapPin size={10} className="shrink-0" />
                          {match.location} · {formatDate(match.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                          {match.scoreUs}–{match.scoreThem}
                        </p>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block"
                          style={{ color: resultColor, background: resultBg }}
                        >
                          {resultLabel}
                        </span>
                      </div>
                    </div>

                    {/* Footer meta */}
                    <div className="flex gap-4 mt-3 pt-3 text-xs"
                         style={{ borderTop: '1px solid var(--border-faint)', color: 'var(--text-faint)' }}>
                      <span className="flex items-center gap-1">
                        <Goal size={11} strokeWidth={1.75} />
                        {match.events.filter(e => e.type === 'goal').length} mål
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} strokeWidth={1.75} />
                        {Object.values(match.lineup).length + match.bench.length} udtaget
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3"
       style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}
