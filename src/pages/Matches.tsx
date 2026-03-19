import { useNavigate } from 'react-router-dom'
import { Plus, MapPin } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })

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
            <h1 className="text-[2rem] font-black text-white tracking-tight leading-none">
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
        <div className="text-center py-20 text-slate-600 px-4">
          <p className="text-4xl mb-4">🏟️</p>
          <p className="text-slate-400 font-semibold">Ingen kampe endnu</p>
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
                  className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform relative overflow-hidden border border-orange-500/15"
                  style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.07) 0%, #12131c 70%)' }}
                >
                  <div
                    className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                    style={{ background: 'linear-gradient(180deg, #f97316, #fbbf24)' }}
                  />
                  <div className="pl-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base truncate">
                        vs. {match.opponent}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin size={10} className="shrink-0" />
                        {match.location} · {formatShortDate(match.date)}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 border border-orange-500/30"
                      style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}
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
                    className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform border border-white/[0.05]"
                    style={{ background: '#12131c' }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Result indicator */}
                      <div
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ background: resultColor, minHeight: '36px' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          vs. {match.opponent}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
                          <MapPin size={10} className="shrink-0" />
                          {match.location} · {formatDate(match.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-white leading-none">
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
                    <div className="flex gap-4 mt-3 pt-3 border-t border-white/[0.04] text-xs text-slate-600">
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
    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.12em] mb-3">
      {children}
    </p>
  )
}
