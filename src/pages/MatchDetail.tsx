import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import EventsTab from '../components/matches/EventsTab'
import AttendanceTab from '../components/matches/AttendanceTab'
import LineupTab from '../components/lineup/LineupTab'
import { displayName } from '../utils/playerName'
import { useRealtimeMatch } from '../hooks/useRealtimeMatch'

type Tab = 'tilmelding' | 'begivenheder' | 'opstilling'

/** Extracts HH:MM from an ISO string like '2026-04-07T20:30' — returns '' if no time present. */
const extractTime = (iso: string): string => {
  const t = iso.split('T')[1]
  return t ? t.slice(0, 5) : ''
}

/**
 * "Tirsdag 7. april · 20:30"  (with time)
 * "Tirsdag 7. april"          (date-only)
 */
const formatDate = (iso: string): string => {
  const [datePart] = iso.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const weekday  = dateObj.toLocaleDateString('da-DK', { weekday: 'long' })
  const dayMonth = dateObj.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const time = extractTime(iso)
  return time ? `${cap} ${dayMonth} · ${time}` : `${cap} ${dayMonth}`
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const match = useMatchStore((s) => s.matches.find((m) => m.id === id))
  const completeMatch = useMatchStore((s) => s.completeMatch)
  const setManOfTheMatch = useMatchStore((s) => s.setManOfTheMatch)
  const players = usePlayerStore((s) => s.players)

  const isAdmin = useAuthStore((s) => s.isAdmin)

  useRealtimeMatch(id ?? '')

  const [tab, setTab] = useState<Tab>('tilmelding')

  if (!match) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={18} /> Tilbage
        </button>
        <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>Kamp ikke fundet</p>
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
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Subtle result glow */}
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
            className="flex items-center gap-1.5 font-medium text-sm active:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft size={17} strokeWidth={2.5} /> Kampe
          </button>
          {isAdmin && !match.isCompleted && (
            <button
              onClick={() => completeMatch(match.id)}
              className="text-xs px-3.5 py-1.5 rounded-full font-semibold active:scale-95 transition-transform"
              style={{
                background: 'var(--badge-accent-bg)',
                color: 'var(--badge-accent-text)',
                border: '1px solid var(--badge-accent-border)',
              }}
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
          <div className="w-1 h-4 rounded-full" style={{ background: 'var(--section-bar-bg)' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em]"
             style={{ color: 'var(--section-label-color)' }}>
            {match.location}
          </p>
        </div>
        <h2 className="text-xl font-black tracking-tight mb-0.5" style={{ color: 'var(--text-primary)' }}>
          Spartak vs. {match.opponent}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(match.date)}</p>

        {/* ── Score display ──────────────────────────────────── */}
        <div className="mt-5">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Spartak</p>
              <p
                className="text-6xl font-black leading-none"
                style={{ color: won ? '#4ade80' : 'var(--text-primary)' }}
              >
                {match.scoreUs}
              </p>
            </div>
            <p className="text-3xl font-bold mt-3" style={{ color: 'var(--text-dimmer)' }}>–</p>
            <div className="text-center">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{match.opponent}</p>
              <p className="text-6xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                {match.scoreThem}
              </p>
            </div>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-faint)' }}>
            {match.isCompleted ? 'Afsluttet' : 'Scoren opdateres automatisk fra mål'}
          </p>
        </div>

        {/* ── Man of the match ──────────────────────────────── */}
        <div
          className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-faint)',
          }}
        >
          <Star size={13} className="text-yellow-400 shrink-0" />
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>Kampens spiller</span>
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
                : <span className="italic" style={{ color: 'var(--text-faint)' }}>Ikke valgt</span>
              }
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex px-4 mt-4 gap-2">
        {(['tilmelding', 'begivenheder', 'opstilling'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={
              tab === t
                ? {
                    background: 'var(--tab-active-bg)',
                    boxShadow: '0 4px 14px var(--tab-active-shadow)',
                    color: 'var(--tab-active-color)',
                  }
                : {
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }
            }
          >
            {t === 'tilmelding' ? 'Tilmelding' : t === 'begivenheder' ? 'Begivenheder' : 'Opstilling'}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <div className="px-4 mt-4">
        {tab === 'tilmelding'   && <AttendanceTab matchId={match.id} />}
        {tab === 'begivenheder' && <EventsTab matchId={match.id} />}
        {tab === 'opstilling'   && <LineupTab matchId={match.id} />}
      </div>
    </div>
  )
}
