import { useNavigate } from 'react-router-dom'
import { Plus, MapPin } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'

/** Extracts HH:MM from an ISO string like '2026-04-07T20:30' — returns '' if no time present. */
const extractTime = (iso: string): string => {
  const t = iso.split('T')[1]
  return t ? t.slice(0, 5) : ''
}

/**
 * "Tirs. 07-04-2026 · 20:30"  (with time)
 * "Tirs. 07-04-2026"           (date-only)
 */
const formatListDate = (iso: string): string => {
  const [datePart] = iso.split('T')
  const [y, m, d] = datePart.split('-')
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
  const weekday = dateObj.toLocaleDateString('da-DK', { weekday: 'short' })
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const time = extractTime(iso)
  const base = `${weekdayCap} ${d}-${m}-${y}`
  return time ? `${base} · ${time}` : base
}

const formatDate    = formatListDate
const formatShortDate = formatListDate

export default function Matches() {
  const navigate = useNavigate()
  const matches  = useMatchStore((s) => s.matches)
  const isAdmin  = useAuthStore((s) => s.isAdmin)

  const upcoming  = matches.filter((m) => !m.isCompleted)
  const completed = matches.filter((m) => m.isCompleted)

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
                Kampprogram
              </span>
            </div>
            <h1 className="text-[2rem] font-black tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}>
              Kampe
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/kampe/ny')}
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

      {/* ── Empty state ───────────────────────────────────── */}
      {matches.length === 0 && (
        <div className="text-center py-20 px-4" style={{ color: 'var(--text-faint)' }}>
          <p className="text-4xl mb-4">🏟️</p>
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
              {upcoming.map((match) => (
                <button
                  key={match.id}
                  onClick={() => navigate(`/kampe/${match.id}`)}
                  className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, var(--accent-card-tint) 0%, var(--bg-card) 70%)`,
                    border: '1px solid var(--accent-card-border)',
                  }}
                >
                  <div
                    className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                    style={{ background: 'linear-gradient(180deg, #f97316, #fbbf24)' }}
                  />
                  <div className="pl-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                        vs. {match.opponent}
                      </p>
                      <p className="text-xs mt-0.5 flex items-center gap-1"
                         style={{ color: 'var(--text-muted)' }}>
                        <MapPin size={10} className="shrink-0" />
                        {match.location} · {formatShortDate(match.date)}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        background: 'rgba(249,115,22,0.12)',
                        color: '#fb923c',
                        border: '1px solid rgba(249,115,22,0.30)',
                      }}
                    >
                      Kommende
                    </span>
                  </div>
                </button>
              ))}
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
                      <span>⚽ {match.events.filter(e => e.type === 'goal').length} mål</span>
                      <span>👥 {Object.values(match.lineup).length + match.bench.length} udtaget</span>
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
