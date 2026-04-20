import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import EventsTab from '../components/matches/EventsTab'
import AttendanceTab from '../components/matches/AttendanceTab'
import LineupTab from '../components/lineup/LineupTab'
import CompleteMatchSheet from '../components/matches/CompleteMatchSheet'
import MotmSheet from '../components/matches/MotmSheet'
import ClubCrest from '../components/ClubCrest'
import OpponentCrest from '../components/OpponentCrest'
import { displayName } from '../utils/playerName'
import { CLUB_NAME } from '../data/leagueTable'
import { fmtLong } from '../utils/dateFormat'
import { useRealtimeMatch } from '../hooks/useRealtimeMatch'
import { isMatchLive } from '../utils/matchTime'
import type { Match, Player } from '../types'

type Tab = 'tilmelding' | 'begivenheder' | 'opstilling'

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const match           = useMatchStore((s) => s.matches.find((m) => m.id === id))
  const completeMatch   = useMatchStore((s) => s.completeMatch)
  const updateMatch     = useMatchStore((s) => s.updateMatch)
  const reopenMatch     = useMatchStore((s) => s.reopenMatch)
  const setManOfTheMatch = useMatchStore((s) => s.setManOfTheMatch)
  const players         = usePlayerStore((s) => s.players)
  const isAdmin         = useAuthStore((s) => s.isAdmin)

  useRealtimeMatch(id ?? '')

  // Smart default: show events after/during match, attendance before
  const [tab, setTab] = useState<Tab>(() => {
    if (!match) return 'tilmelding'
    if (match.isCompleted || isMatchLive(match)) return 'begivenheder'
    return 'tilmelding'
  })

  const [showCompleteSheet, setShowCompleteSheet] = useState(false)
  const [showMotmSheet,     setShowMotmSheet]     = useState(false)

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

  const resultColor = won ? '#4ade80' : draw ? '#facc15' : lost ? 'var(--color-loss)' : undefined
  const resultLabel = won ? 'Sejr' : draw ? 'Uafgjort' : lost ? 'Nederlag' : null

  const live = isMatchLive(match)

  return (
    <div className="pb-8">

      {/* ── Sheets ────────────────────────────────────────────── */}
      {showCompleteSheet && (
        <CompleteMatchSheet
          match={match}
          onConfirm={(scoreUs, scoreThem) => {
            updateMatch(match.id, { scoreUs, scoreThem })
            completeMatch(match.id)
            setShowCompleteSheet(false)
            setTimeout(() => setShowMotmSheet(true), 400)
          }}
          onCancel={() => setShowCompleteSheet(false)}
        />
      )}

      {showMotmSheet && (
        <MotmSheet
          match={match}
          players={players}
          currentMotm={match.manOfTheMatch ?? null}
          onSelect={(playerId) => {
            setManOfTheMatch(match.id, playerId)
            setShowMotmSheet(false)
          }}
          onSkip={() => setShowMotmSheet(false)}
        />
      )}

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

        {/* Back + reopen row */}
        <div className="flex items-center justify-between mb-5 relative">
          <button
            onClick={() => navigate('/kampe')}
            className="flex items-center gap-1.5 font-medium text-sm active:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft size={17} strokeWidth={2.5} /> Kampe
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && match.isCompleted && (
              <button
                onClick={() => reopenMatch(match.id)}
                className="text-xs px-3.5 py-1.5 rounded-full font-semibold active:scale-95 transition-transform"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color:      '#ef4444',
                  border:     '1px solid rgba(239,68,68,0.30)',
                }}
              >
                Genåbn kamp
              </button>
            )}
            {resultLabel && (
              <span
                className="text-[11px] font-bold px-3 py-1 rounded-full border"
                style={{
                  color:       resultColor,
                  background:  `${resultColor}18`,
                  borderColor: `${resultColor}40`,
                }}
              >
                {resultLabel}
              </span>
            )}
          </div>
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
          {CLUB_NAME} vs. {match.opponent}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{fmtLong(match.date)}</p>

        {/* ── Score display ─────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-2 px-1">

          {/* Spartak side */}
          <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 88 }}>
            <ClubCrest size={80} />
            <p className="text-[11px] font-semibold text-center leading-tight w-full truncate"
               style={{ color: 'var(--text-secondary)' }}>
              {CLUB_NAME}
            </p>
          </div>

          {/* Score center */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            {match.isCompleted ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-6xl leading-none tabular-nums"
                        style={{ color: won ? '#4ade80' : 'var(--text-primary)' }}>
                    {match.scoreUs}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-dimmer)' }}>–</span>
                  <span className="font-display text-6xl leading-none tabular-nums"
                        style={{ color: 'var(--text-primary)' }}>
                    {match.scoreThem}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Afsluttet</p>
              </>
            ) : live ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-6xl leading-none tabular-nums"
                        style={{ color: '#4ade80' }}>
                    {match.scoreUs}
                  </span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-dimmer)' }}>–</span>
                  <span className="font-display text-6xl leading-none tabular-nums"
                        style={{ color: 'var(--text-primary)' }}>
                    {match.scoreThem}
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1 animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.30)' }}
                >
                  LIVE
                </span>
              </>
            ) : (
              <>
                {match.date.includes('T') ? (
                  <span className="font-display text-5xl leading-none tabular-nums"
                        style={{ color: 'var(--text-primary)' }}>
                    {match.date.split('T')[1]?.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-3xl font-black leading-none" style={{ color: 'var(--text-dimmer)' }}>–</span>
                )}
                <p className="text-[10px] mt-1 uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>
                  Kampstart
                </p>
              </>
            )}
          </div>

          {/* Opponent side */}
          <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 88 }}>
            <OpponentCrest opponent={match.opponent} size={80} />
            <p className="text-[11px] font-semibold text-center leading-tight w-full truncate"
               style={{ color: 'var(--text-secondary)' }}>
              {match.opponent}
            </p>
          </div>
        </div>

        {/* ── Man of the match ──────────────────────────────── */}
        <div
          className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}
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

      {/* ── Community voting ──────────────────────────────────── */}
      {match.isCompleted && (
        <MotmVoting matchId={match.id} match={match} players={players} />
      )}

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="flex px-4 mt-4 gap-2">
        {(['tilmelding', 'begivenheder', 'opstilling'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
            style={{
              transition: 'background 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 120ms ease',
              ...(tab === t
                ? {
                    background: 'var(--tab-active-bg)',
                    boxShadow:  '0 4px 14px var(--tab-active-shadow)',
                    color:      'var(--tab-active-color)',
                    transform:  'scale(1)',
                  }
                : {
                    background: 'var(--bg-card)',
                    border:     '1px solid var(--border)',
                    color:      'var(--text-muted)',
                    transform:  'scale(1)',
                  }),
            }}
            onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
            onPointerUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            {t === 'tilmelding' ? 'Tilmelding' : t === 'opstilling' ? 'Opstilling' : (
              <>
                Begivenheder
                {live && (
                  <span className="inline-flex items-center gap-1" style={{ color: tab === 'begivenheder' ? 'var(--cta-color)' : 'var(--accent)' }}>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: tab === 'begivenheder' ? 'currentColor' : 'var(--accent)',
                        animation:  'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <div key={tab} className="px-4 mt-4 animate-tab-enter">
        {tab === 'tilmelding'   && <AttendanceTab matchId={match.id} />}
        {tab === 'begivenheder' && (
          <EventsTab
            matchId={match.id}
            onRequestComplete={() => setShowCompleteSheet(true)}
          />
        )}
        {tab === 'opstilling'   && <LineupTab matchId={match.id} />}
      </div>
    </div>
  )
}

/** Community Man of the Match voting — stored in localStorage per match. */
function MotmVoting({ matchId, match, players }: {
  matchId: string
  match: Match
  players: Player[]
}) {
  const STORAGE_KEY = `motm_votes_${matchId}`

  const loadVotes = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
  }

  const [votes, setVotes] = useState<Record<string, string>>(loadVotes)
  const myId = localStorage.getItem('spartak_my_player_id') ?? ''

  const myVote   = votes[myId] ?? ''
  const hasVoted = !!myVote
  const eligible = players.filter((p) =>
    match.attendance.includes(p.id) ||
    Object.values(match.lineup).includes(p.id) ||
    match.starters.includes(p.id)
  )

  const vote = (nomineeId: string) => {
    if (!myId) return
    const updated = { ...votes, [myId]: nomineeId }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setVotes(updated)
  }

  // Tally
  const tally = eligible.map((p) => ({
    player: p,
    count:  Object.values(votes).filter((v) => v === p.id).length,
  })).sort((a, b) => b.count - a.count)

  const maxVotes = tally[0]?.count ?? 0

  if (eligible.length === 0) return null

  return (
    <div
      className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-faint)' }}
      >
        <Star size={13} className="text-yellow-400 shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
           style={{ color: 'var(--text-muted)' }}>
          Stem på kampens spiller
        </p>
        <span
          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: 'var(--icon-accent-bg)',
            color:      'var(--accent)',
            border:     '1px solid var(--badge-accent-border)',
          }}
        >
          {Object.keys(votes).length} {Object.keys(votes).length === 1 ? 'stemme' : 'stemmer'}
        </span>
      </div>

      <div className="px-4 py-3">
        {!hasVoted ? (
          <div className="flex flex-wrap gap-2">
            {eligible.map((p) => (
              <button
                key={p.id}
                onClick={() => vote(p.id)}
                disabled={!myId}
                className="px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40"
                style={{
                  background: 'var(--bg-raised)',
                  color:      'var(--text-primary)',
                  border:     '1px solid var(--border)',
                }}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
            {!myId && (
              <p className="text-[10px] w-full mt-1 italic" style={{ color: 'var(--text-faint)' }}>
                Tilmeld dig en kamp for at stemme
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tally.map(({ player, count }) => {
              const isWinner = count === maxVotes && count > 0
              const pct      = maxVotes > 0 ? (count / maxVotes) * 100 : 0
              const isMyVote = myVote === player.id
              return (
                <div key={player.id}>
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <span className="text-xs font-semibold truncate"
                          style={{ color: isWinner ? '#eab308' : 'var(--text-primary)' }}>
                      {isWinner && '⭐ '}{player.name.split(' ')[0]}
                      {isMyVote && (
                        <span className="ml-1 text-[9px]" style={{ color: 'var(--text-faint)' }}>(din stemme)</span>
                      )}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {count} {count === 1 ? 'stemme' : 'stemmer'}
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden h-1.5" style={{ background: 'var(--bg-raised)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: isWinner ? '#eab308' : 'var(--accent)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
