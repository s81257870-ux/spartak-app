import { useState } from 'react'
import { Clock, MapPin, UserCheck, CheckCircle2 } from 'lucide-react'
import { useTrainingStore } from '../store/trainingStore'
import { usePlayerStore } from '../store/playerStore'
import PlayerAvatar from '../components/players/PlayerAvatar'

// Shared key — same identity used for match attendance
const MY_PLAYER_KEY = 'spartak_my_player_id'

/** "Mandag 30. marts" — Copenhagen-locale long format */
function formatTrainingDate(date: string): string {
  // Parse as noon UTC to avoid any timezone-date-flip edge cases
  const d = new Date(`${date}T12:00:00Z`)
  const weekday = new Intl.DateTimeFormat('da-DK', { weekday: 'long' }).format(d)
  const dayMonth = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long' }).format(d)
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}`
}

export default function Trainings() {
  const trainings    = useTrainingStore((s) => s.trainings)
  const signUp       = useTrainingStore((s) => s.signUp)
  const cancelSignUp = useTrainingStore((s) => s.cancelSignUp)
  const players      = usePlayerStore((s) => s.players)

  // Player identity — reuse the same localStorage key as match attendance so
  // the user only picks their name once across the whole app.
  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem(MY_PLAYER_KEY) ?? ''
  )
  const [showPicker, setShowPicker]         = useState(myPlayerId === '')
  const [expandedId, setExpandedId]         = useState<string | null>(null)

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

          return (
            <div
              key={training.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: isNext
                  ? '1px solid rgba(149,197,233,0.28)'
                  : '1px solid var(--border)',
              }}
            >
              {/* Card top row */}
              <div className="px-4 pt-4 pb-3">

                {/* "Næste træning" badge on the first card */}
                {isNext && (
                  <div className="mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md"
                      style={{
                        background: 'rgba(149,197,233,0.12)',
                        color:      'var(--accent)',
                      }}
                    >
                      Næste træning
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  {/* Date / time / location */}
                  <div>
                    <p
                      className="font-bold text-base leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatTrainingDate(training.date)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} style={{ color: 'var(--text-faint)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {training.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: 'var(--text-faint)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {training.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance count — tapping toggles the attendee list */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : training.id)}
                    className="flex items-center gap-1.5 shrink-0 active:opacity-60 transition-opacity"
                    aria-label="Vis tilmeldte"
                  >
                    <UserCheck
                      size={15}
                      style={{
                        color: training.attendance.length > 0
                          ? 'var(--accent)'
                          : 'var(--text-faint)',
                      }}
                    />
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: training.attendance.length > 0
                          ? 'var(--accent)'
                          : 'var(--text-faint)',
                      }}
                    >
                      {training.attendance.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sign-up / cancel row */}
              {myPlayerId !== '' && !showPicker && (
                <div className="px-4 pb-4">
                  {isSignedUp ? (
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1"
                        style={{
                          background: 'rgba(74,222,128,0.08)',
                          border:     '1px solid rgba(74,222,128,0.20)',
                        }}
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

              {/* Expandable attendee list */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 pt-1"
                  style={{ borderTop: '1px solid var(--border-faint)' }}
                >
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
                            style={{
                              background: isMe
                                ? 'rgba(149,197,233,0.07)'
                                : 'var(--bg-raised)',
                            }}
                          >
                            <PlayerAvatar name={name} size="sm" />
                            <span
                              className="text-sm font-medium"
                              style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}
                            >
                              {name}
                              {isMe && (
                                <span
                                  className="ml-1.5 text-xs font-normal"
                                  style={{ color: 'rgba(149,197,233,0.60)' }}
                                >
                                  (dig)
                                </span>
                              )}
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
