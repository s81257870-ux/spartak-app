import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import EventsTab from '../components/matches/EventsTab'
import LineupTab from '../components/lineup/LineupTab'
import { displayName } from '../utils/playerName'
import { useRealtimeMatch } from '../hooks/useRealtimeMatch'

type Tab = 'begivenheder' | 'opstilling'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const match = useMatchStore((s) => s.matches.find((m) => m.id === id))
  const completeMatch = useMatchStore((s) => s.completeMatch)
  const setManOfTheMatch = useMatchStore((s) => s.setManOfTheMatch)
  const players = usePlayerStore((s) => s.players)

  const isAdmin = useAuthStore((s) => s.isAdmin)

  useRealtimeMatch(id ?? '')

  const [tab, setTab] = useState<Tab>('begivenheder')

  if (!match) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="text-orange-400 flex items-center gap-1">
          <ArrowLeft size={18} /> Tilbage
        </button>
        <p className="text-slate-400 mt-4">Kamp ikke fundet</p>
      </div>
    )
  }

  const won  = match.isCompleted && match.scoreUs > match.scoreThem
  const draw = match.isCompleted && match.scoreUs === match.scoreThem
  const lost = match.isCompleted && match.scoreUs < match.scoreThem

  const resultColor = won ? '#4ade80' : draw ? '#facc15' : lost ? '#f87171' : undefined
  const resultLabel = won ? 'Sejr' : draw ? 'Uafgjort' : lost ? 'Nederlag' : null

  return (
    <div className="pb-8">

      {/* ── Match header ──────────────────────────────────────── */}
      <div
        className="relative px-4 pt-8 pb-6 overflow-hidden"
        style={{ background: '#12131c' }}
      >
        {/* Subtle glow behind score */}
        {resultColor && (
          <div
            className="absolute top-0 right-0 w-48 h-36 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(ellipse, ${resultColor}15 0%, transparent 70%)` }}
          />
        )}

        {/* Back + action row */}
        <div className="flex items-center justify-between mb-5 relative">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-orange-400 font-medium text-sm active:opacity-70"
          >
            <ArrowLeft size={17} strokeWidth={2.5} /> Kampe
          </button>
          {isAdmin && !match.isCompleted && (
            <button
              onClick={() => completeMatch(match.id)}
              className="text-xs px-3.5 py-1.5 rounded-full font-semibold active:scale-95 transition-transform border border-orange-500/30"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}
            >
              Afslut kamp
            </button>
          )}
          {resultLabel && (
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full border"
              style={{
                color: resultColor,
                background: `${resultColor}18`,
                borderColor: `${resultColor}40`,
              }}
            >
              {resultLabel}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-400 to-amber-500" />
          <p className="text-orange-400/70 text-[10px] font-bold uppercase tracking-[0.15em]">
            {match.location}
          </p>
        </div>
        <h2 className="text-xl font-black text-white mb-0.5 tracking-tight">
          Spartak vs. {match.opponent}
        </h2>
        <p className="text-slate-500 text-sm">{formatDate(match.date)}</p>

        {/* ── Score display ──────────────────────────────────── */}
        <div className="mt-5">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-slate-500 text-xs font-medium mb-1">Spartak</p>
              <p
                className="text-6xl font-black leading-none"
                style={{ color: won ? '#4ade80' : 'white' }}
              >
                {match.scoreUs}
              </p>
            </div>
            <p className="text-slate-700 text-3xl font-bold mt-3">–</p>
            <div className="text-center">
              <p className="text-slate-500 text-xs font-medium mb-1">{match.opponent}</p>
              <p className="text-6xl font-black leading-none text-white">{match.scoreThem}</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs text-center mt-3">
            {match.isCompleted ? 'Afsluttet' : 'Scoren opdateres automatisk fra mål'}
          </p>
        </div>

        {/* ── Man of the match ──────────────────────────────── */}
        <div
          className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-white/[0.05]"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <Star size={13} className="text-yellow-400 shrink-0" />
          <span className="text-xs text-slate-500 shrink-0">Kampens spiller</span>
          {isAdmin ? (
            <select
              value={match.manOfTheMatch ?? ''}
              onChange={(e) => setManOfTheMatch(match.id, e.target.value || undefined)}
              className="flex-1 bg-transparent text-yellow-400 text-xs font-semibold focus:outline-none min-w-0"
            >
              <option value="">Vælg spiller</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{displayName(p, players)}</option>
              ))}
            </select>
          ) : (
            <span className="flex-1 text-yellow-400 text-xs font-semibold min-w-0 truncate">
              {match.manOfTheMatch
                ? displayName(players.find((p) => p.id === match.manOfTheMatch)!, players)
                : <span className="text-slate-600 italic">Ikke valgt</span>
              }
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex px-4 mt-4 gap-2">
        {(['begivenheder', 'opstilling'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? 'text-black' : 'text-slate-500 border border-white/[0.06] active:opacity-75'
            }`}
            style={
              tab === t
                ? {
                    background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.28)',
                  }
                : { background: '#12131c' }
            }
          >
            {t === 'begivenheder' ? 'Begivenheder' : 'Opstilling'}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <div className="px-4 mt-4">
        {tab === 'begivenheder' && <EventsTab matchId={match.id} />}
        {tab === 'opstilling'   && <LineupTab matchId={match.id} />}
      </div>
    </div>
  )
}
