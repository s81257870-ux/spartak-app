import { useState } from 'react'
import { Clock, MapPin, UserCheck, CheckCircle2 } from 'lucide-react'
import { useTrainingStore } from '../store/trainingStore'
import { usePlayerStore } from '../store/playerStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import type { Player, Training } from '../types'

// Shared key — same identity used for match attendance
const MY_PLAYER_KEY = 'spartak_my_player_id'

// Training is confirmed once this many players sign up
const THRESHOLD = 10

// ── Attendance state ───────────────────────────────────────────────────────────

type AttState = 'low' | 'lowmedium' | 'medium' | 'high' | 'full'

function attState(count: number): AttState {
  if (count >= THRESHOLD) return 'full'
  if (count >= 8)          return 'high'
  if (count >= 6)          return 'medium'
  if (count >= 4)          return 'lowmedium'
  return 'low'
}

const STATE_COLOR: Record<AttState, string> = {
  low:       '#f87171',   // red-400
  lowmedium: '#fb923c',   // orange-400
  medium:    '#fbbf24',   // amber-400
  high:      '#a3e635',   // lime-400
  full:      '#4ade80',   // green-400
}

const STATE_LABEL: Record<AttState, string> = {
  low:       'Er I døde eller hvad?',
  lowmedium: 'Tilmeld jer',
  medium:    'Det begynder at ligne noget',
  high:      'SÅ TÆT',
  full:      'Holdet er samlet',
}

function getMicrocopy(count: number, isSignedUp: boolean): string {
  const needed = THRESHOLD - count
  if (count >= THRESHOLD) {
    return isSignedUp ? 'Du er med. Så er der træning!' : 'Så er der træning!'
  }
  if (isSignedUp) {
    if (needed === 1) return 'Vi mangler én mere – ring til nogen!'
    if (count >= 8)   return `${needed} mere så spiller vi!`
    if (count >= 6)   return `${needed} mere så spiller vi!`
    return `Godkendt – men ${needed} mangler stadig`
  }
  if (count === 0) return 'Nogen der gider møde op?'
  if (needed === 1) return '1 mere så spiller vi – det er dig!'
  if (count >= 8)   return `${needed} mere. Vi er næsten der.`
  if (count >= 6)   return `${needed} mere. Vi er næsten der.`
  return 'Meld dig ind og red træningen'
}

function getCtaLabel(state: AttState): string {
  return state === 'high' ? 'Jeg er med!' : 'Tilmeld mig'
}

// ── Social label ───────────────────────────────────────────────────────────────
// "Sebastian, Anton og 4 andre tilmeldt"

function buildSocialLabel(
  attendance: string[],
  players: Player[],
  myPlayerId: string,
): string {
  if (attendance.length === 0) return ''
  // Surface the current player first
  const sorted = [...attendance].sort((a, b) => {
    if (a === myPlayerId) return -1
    if (b === myPlayerId) return 1
    return 0
  })
  const first = (id: string) => {
    const p = players.find((pl) => pl.id === id)
    return p?.name.split(' ')[0] ?? 'Ukendt'
  }
  const n = sorted.length
  if (n === 1) return `${first(sorted[0])} tilmeldt`
  if (n === 2) return `${first(sorted[0])} og ${first(sorted[1])} tilmeldt`
  if (n === 3) return `${first(sorted[0])}, ${first(sorted[1])} og ${first(sorted[2])} tilmeldt`
  return `${first(sorted[0])}, ${first(sorted[1])} og ${n - 2} andre tilmeldt`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** "Mandag 30. marts" — Copenhagen-locale long format */
function formatTrainingDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  const weekday = new Intl.DateTimeFormat('da-DK', { weekday: 'long' }).format(d)
  const dayMonth = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long' }).format(d)
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}`
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Trainings() {
  const trainings    = useTrainingStore((s) => s.trainings)
  const signUp       = useTrainingStore((s) => s.signUp)
  const cancelSignUp = useTrainingStore((s) => s.cancelSignUp)
  const players      = usePlayerStore((s) => s.players)

  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem(MY_PLAYER_KEY) ?? ''
  )
  const [showPicker, setShowPicker] = useState(myPlayerId === '')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const myPlayer = players.find((p) => p.id === myPlayerId) ?? null

  const selectPlayer = (id: string) => {
    setMyPlayerId(id)
    localStorage.setItem(MY_PLAYER_KEY, id)
    setShowPicker(false)
  }

  return (
    <div className="pb-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-7 overflow-hidden">
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--section-bar-bg)' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: 'var(--section-label-color)' }}
            >
              Sæson 2025
            </span>
          </div>
          <h1
            className="text-[2rem] font-black tracking-tight leading-none mb-1.5"
            style={{ color: 'var(--text-primary)' }}
          >
            Træninger
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Mandag 19:30 · Ryparken Idrætsanlæg
          </p>
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Identity picker / switcher ────────────────────────────────── */}
        {showPicker ? (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Hvem er du?
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPlayer(p.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
                  style={{
                    background: 'var(--bg-input)',
                    border:     '1px solid var(--border-input)',
                    color:      'var(--text-primary)',
                  }}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <PlayerAvatar name={myPlayer?.name ?? '?'} size="sm" />
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] uppercase tracking-wider font-semibold"
                style={{ color: 'var(--text-faint)' }}
              >
                Du er logget ind som
              </p>
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {myPlayer?.name ?? 'Ukendt'}
              </p>
            </div>
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs underline underline-offset-2 active:opacity-60 shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              Skift
            </button>
          </div>
        )}

        {/* ── Training cards ────────────────────────────────────────────── */}
        {trainings.map((training, index) => {
          const isNext     = index === 0
          const isSignedUp = myPlayerId !== '' && training.attendance.includes(myPlayerId)
          const isExpanded = expandedId === training.id

          return isNext
            ? (
              <NextTrainingCard
                key={training.id}
                training={training}
                players={players}
                myPlayerId={myPlayerId}
                isSignedUp={isSignedUp}
                showActions={myPlayerId !== '' && !showPicker}
                onSignUp={() => signUp(training.id, myPlayerId)}
                onCancel={() => cancelSignUp(training.id, myPlayerId)}
              />
            )
            : (
              /* ── Future training card (compact) ─────────────────────── */
              <div
                key={training.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {formatTrainingDate(training.date)}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: 'var(--text-faint)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{training.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} style={{ color: 'var(--text-faint)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{training.location}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : training.id)}
                      className="flex items-center gap-1.5 shrink-0 active:opacity-60 transition-opacity"
                      aria-label="Vis tilmeldte"
                    >
                      <UserCheck
                        size={15}
                        style={{ color: training.attendance.length > 0 ? 'var(--accent)' : 'var(--text-faint)' }}
                      />
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: training.attendance.length > 0 ? 'var(--accent)' : 'var(--text-faint)' }}
                      >
                        {training.attendance.length}
                      </span>
                    </button>
                  </div>
                </div>

                {myPlayerId !== '' && !showPicker && (
                  <div className="px-4 pb-4">
                    {isSignedUp ? (
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1"
                          style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)' }}
                        >
                          <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                          <span className="text-green-400 font-semibold text-sm">Tilmeldt</span>
                        </div>
                        <button
                          onClick={() => cancelSignUp(training.id, myPlayerId)}
                          className="shrink-0 text-xs font-semibold px-3 py-2.5 rounded-xl active:opacity-70 transition-opacity"
                          style={{
                            background: 'var(--bg-input)',
                            border:     '1px solid var(--border-input)',
                            color:      'var(--text-secondary)',
                          }}
                        >
                          Afmeld
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => signUp(training.id, myPlayerId)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
                        style={{
                          background: 'var(--cta-bg)',
                          color:      'var(--cta-color)',
                          boxShadow:  '0 4px 14px var(--cta-shadow)',
                        }}
                      >
                        Tilmeld mig
                      </button>
                    )}
                  </div>
                )}

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--border-faint)' }}>
                    {training.attendance.length === 0 ? (
                      <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>
                        Ingen tilmeldinger endnu
                      </p>
                    ) : (
                      <div className="space-y-2 mt-1">
                        {training.attendance.map((id) => {
                          const player = players.find((p) => p.id === id)
                          const name   = player?.name ?? 'Ukendt spiller'
                          const isMe   = id === myPlayerId
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                              style={{ background: isMe ? 'rgba(149,197,233,0.07)' : 'var(--bg-raised)' }}
                            >
                              <PlayerAvatar name={name} size="sm" />
                              <span className="text-sm font-medium" style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                                {name}
                                {isMe && <span className="ml-1.5 text-xs font-normal" style={{ color: 'rgba(149,197,233,0.60)' }}>(dig)</span>}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
        })}
      </div>
    </div>
  )
}

// ── NextTrainingCard ───────────────────────────────────────────────────────────
// Enhanced hero card for the upcoming session — progress bar, social layer,
// contextual microcopy, and urgency-aware CTA.

interface NextCardProps {
  training:    Training
  players:     Player[]
  myPlayerId:  string
  isSignedUp:  boolean
  showActions: boolean
  onSignUp:    () => void
  onCancel:    () => void
}

function NextTrainingCard({
  training, players, myPlayerId, isSignedUp, showActions, onSignUp, onCancel,
}: NextCardProps) {
  const count    = training.attendance.length
  const state    = attState(count)
  const color    = STATE_COLOR[state]
  const fillPct  = Math.min((count / THRESHOLD) * 100, 100)
  const social   = buildSocialLabel(training.attendance, players, myPlayerId)
  const microcopy = getMicrocopy(count, isSignedUp)

  // Up to 5 avatars shown stacked
  const avatarIds = training.attendance.slice(0, 5)
  const overflow  = count - avatarIds.length

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border:     `1px solid ${color}40`,
      }}
    >
      {/* ── Top: date + meta ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-0">
        <div className="mb-2.5">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md"
            style={{ background: `${color}18`, color }}
          >
            Næste træning
          </span>
        </div>

        <p className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
          {formatTrainingDate(training.date)}
        </p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: 'var(--text-faint)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{training.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: 'var(--text-faint)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{training.location}</span>
          </div>
        </div>
      </div>

      {/* ── Progress section ─────────────────────────────────────────────── */}
      <div
        className="mx-4 mt-4 mb-0 rounded-xl p-3.5"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}
      >
        {/* Header row: state label + count */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: color }}
            />
            <span className="text-xs font-bold" style={{ color }}>
              {STATE_LABEL[state]}
            </span>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {count} / {THRESHOLD} spillere
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width:      `${fillPct}%`,
              background: color,
              transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1), background 400ms ease',
              boxShadow:  `0 0 8px ${color}60`,
            }}
          />
        </div>

        {/* Microcopy */}
        <p
          className="text-xs mt-2 leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {microcopy}
        </p>
      </div>

      {/* ── Social layer ─────────────────────────────────────────────────── */}
      {count > 0 && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-2.5">
          {/* Stacked avatars */}
          <div className="flex items-center">
            {avatarIds.map((id, i) => {
              const player = players.find((p) => p.id === id)
              const name   = player?.name ?? 'Ukendt'
              return (
                <div
                  key={id}
                  style={{
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex:     avatarIds.length - i,
                    position:   'relative',
                  }}
                >
                  <PlayerAvatar name={name} size="sm" />
                </div>
              )
            })}
            {overflow > 0 && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  marginLeft: -8,
                  zIndex:     0,
                  background: 'var(--bg-raised)',
                  border:     '1px solid var(--border)',
                  color:      'var(--text-muted)',
                }}
              >
                +{overflow}
              </div>
            )}
          </div>

          {/* Name summary */}
          <p className="text-xs leading-snug min-w-0 truncate" style={{ color: 'var(--text-muted)' }}>
            {social}
          </p>
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {showActions && (
        <div className="px-4 py-4">
          {isSignedUp ? (
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-3 flex-1"
                style={{
                  background: 'rgba(74,222,128,0.08)',
                  border:     '1px solid rgba(74,222,128,0.20)',
                }}
              >
                <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                <span className="text-green-400 font-bold text-sm">Du er tilmeldt</span>
              </div>
              <button
                onClick={onCancel}
                className="shrink-0 text-xs font-semibold px-3 py-3 rounded-xl active:opacity-70 transition-opacity"
                style={{
                  background: 'var(--bg-input)',
                  border:     '1px solid var(--border-input)',
                  color:      'var(--text-secondary)',
                }}
              >
                Afmeld
              </button>
            </div>
          ) : (
            <button
              onClick={onSignUp}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
              style={{
                background: state === 'medium'
                  ? `linear-gradient(135deg, #f59e0b, #fbbf24)`
                  : 'var(--cta-bg)',
                color:     state === 'medium' ? '#000' : 'var(--cta-color)',
                boxShadow: state === 'medium'
                  ? '0 4px 16px rgba(251,191,36,0.30)'
                  : '0 4px 14px var(--cta-shadow)',
              }}
            >
              {getCtaLabel(state)}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
