import { useState, useEffect } from 'react'
import { Clock, MapPin, UserCheck, CheckCircle2, UserPlus, X, Ban } from 'lucide-react'
import { useTrainingStore } from '../store/trainingStore'
import { usePlayerStore } from '../store/playerStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import type { Player, Training } from '../types'
import { SEASON_LABEL } from '../data/leagueTable'
import PageHeader from '../components/layout/PageHeader'
import { displayName } from '../utils/playerName'
import { currentTrainingRule, trainingRuleForDate, TRAINING_LOCATION } from '../utils/trainingSchedule'
import { fmtLong } from '../utils/dateFormat'
import { getUpcomingTrainings, getPastTrainings } from '../utils/trainingState'

const MY_PLAYER_KEY = 'spartak_my_player_id'
const THRESHOLD     = 10
const DEADLINE_TIME = '15:30'   // Copenhagen local — Monday sign-up deadline

// ── Attendance state ───────────────────────────────────────────────────────────

type AttState = 'low' | 'lowmedium' | 'medium' | 'high' | 'full'

function attState(total: number): AttState {
  if (total >= THRESHOLD) return 'full'
  if (total >= 8)          return 'high'
  if (total >= 6)          return 'medium'
  if (total >= 4)          return 'lowmedium'
  return 'low'
}

const STATE_COLOR: Record<AttState, string> = {
  low:       '#f87171',
  lowmedium: '#fb923c',
  medium:    '#fbbf24',
  high:      '#a3e635',
  full:      '#4ade80',
}

const STATE_LABEL: Record<AttState, string> = {
  low:       'Er I døde eller hvad?',
  lowmedium: 'Slet ikke nok...',
  medium:    'Det begynder at ligne noget',
  high:      'SÅ TÆT',
  full:      'Holdet er samlet',
}

function getMicrocopy(total: number, isSignedUp: boolean): string {
  const needed = THRESHOLD - total
  if (total >= THRESHOLD) {
    return isSignedUp ? 'Du er med. Så er der træning!' : 'Så er der træning!'
  }
  if (isSignedUp) {
    if (needed === 1) return 'Vi mangler én mere – ring til nogen!'
    if (total >= 6)   return `${needed} mere så spiller vi!`
    return `Godkendt – men ${needed} mangler stadig`
  }
  if (total === 0) return 'Nogen der gider møde op?'
  if (needed === 1) return '1 mere så spiller vi – det er dig!'
  if (total >= 6)   return `${needed} mere. Vi er næsten der.`
  return 'Meld dig ind og red træningen'
}

function getCtaLabel(state: AttState): string {
  return state === 'high' ? 'Jeg er med!' : 'Tilmeld mig'
}

// ── Deadline helpers ───────────────────────────────────────────────────────────

/** True once Copenhagen local time passes Monday 15:30. */
function isDeadlinePassed(trainingDate: string): boolean {
  // Compare Copenhagen "now" string (sv-SE locale = YYYY-MM-DD HH:MM) to deadline
  const copNow = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date()).replace(' ', 'T')
  return copNow >= `${trainingDate}T${DEADLINE_TIME}`
}

/** Minutes remaining until the deadline. Uses browser local time (safe for Danish users). */
function minutesToDeadline(trainingDate: string): number {
  const deadline = new Date(`${trainingDate}T${DEADLINE_TIME}:00`)
  return Math.max(0, Math.round((deadline.getTime() - Date.now()) / 60_000))
}

/** Human-readable countdown: "3 timer 15 min" / "45 min" / "2 dage". */
function formatCountdown(minutes: number): string {
  if (minutes <= 0) return '0 min'
  const days  = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins  = minutes % 60
  if (days >= 1) return `${days} dag${days !== 1 ? 'e' : ''}`
  if (hours >= 1 && mins > 0) return `${hours}t ${mins}m`
  if (hours >= 1) return `${hours} time${hours !== 1 ? 'r' : ''}`
  return `${mins} min`
}

// ── Social label ───────────────────────────────────────────────────────────────

function buildSocialLabel(
  attendance: string[], players: Player[], myPlayerId: string,
): string {
  if (attendance.length === 0) return ''
  const sorted = [...attendance].sort((a, b) =>
    a === myPlayerId ? -1 : b === myPlayerId ? 1 : 0
  )
  const first = (id: string) =>
    players.find((p) => p.id === id)?.name.split(' ')[0] ?? 'Ukendt'
  const n = sorted.length
  if (n === 1) return `${first(sorted[0])} tilmeldt`
  if (n === 2) return `${first(sorted[0])} og ${first(sorted[1])} tilmeldt`
  if (n === 3) return `${first(sorted[0])}, ${first(sorted[1])} og ${first(sorted[2])} tilmeldt`
  return `${first(sorted[0])}, ${first(sorted[1])} og ${n - 2} andre tilmeldt`
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Trainings() {
  const trainings    = useTrainingStore((s) => s.trainings)
  const loading      = useTrainingStore((s) => s.loading)
  const signUp       = useTrainingStore((s) => s.signUp)
  const cancelSignUp = useTrainingStore((s) => s.cancelSignUp)
  const addGuest     = useTrainingStore((s) => s.addGuest)
  const removeGuest  = useTrainingStore((s) => s.removeGuest)
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

  // Tick every minute so the next→past promotion happens automatically in-browser.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Split trainings using the centralised 2-hour cutoff logic.
  // A training stays "upcoming" until 2 hours after its start time.
  const upcomingTrainings = getUpcomingTrainings(trainings)
  const pastTrainings     = getPastTrainings(trainings)

  // Subtitle reflects the schedule of the next training that will actually be held.
  const nextActive    = upcomingTrainings.find((t) => !t.cancelled)
  const scheduleLabel = nextActive ? trainingRuleForDate(nextActive.date).label : currentTrainingRule().label

  return (
    <div className="pb-8">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-7 overflow-hidden">
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <PageHeader label={SEASON_LABEL} title="Træninger" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {scheduleLabel} · {TRAINING_LOCATION}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-3">

        {/* ── Identity picker / switcher ────────────────────────────────── */}
        {showPicker ? (
          <div className="rounded-2xl p-4 space-y-3"
               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Hvem er du?
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <button key={p.id} onClick={() => selectPlayer(p.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                  {displayName(p, players)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <PlayerAvatar name={myPlayer?.name ?? '?'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold"
                 style={{ color: 'var(--text-faint)' }}>Du er logget ind som</p>
              <p className="font-semibold text-sm truncate"
                 style={{ color: 'var(--text-primary)' }}>{myPlayer?.name ?? 'Ukendt'}</p>
            </div>
            <button onClick={() => setShowPicker(true)}
              className="text-xs underline underline-offset-2 active:opacity-60 shrink-0"
              style={{ color: 'var(--text-muted)' }}>Skift</button>
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                 style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* ── Upcoming training cards ───────────────────────────────────── */}
        {!loading && upcomingTrainings.map((training, index) => {
          const isNext     = index === 0
          const isSignedUp = myPlayerId !== '' && training.attendance.includes(myPlayerId)
          const isExpanded = expandedId === training.id

          if (isNext) {
            return (
              <NextTrainingCard
                key={training.id}
                training={training}
                players={players}
                myPlayerId={myPlayerId}
                isSignedUp={isSignedUp}
                showActions={myPlayerId !== '' && !showPicker}
                onSignUp={() => signUp(training.id, myPlayerId)}
                onCancel={() => cancelSignUp(training.id, myPlayerId)}
                onAddGuest={(name) => addGuest(training.id, myPlayerId, name)}
                onRemoveGuest={() => removeGuest(training.id, myPlayerId)}
              />
            )
          }

          // ── Compact future card ────────────────────────────────────────
          return (
            <div key={training.id} className="rounded-2xl overflow-hidden"
                 style={{
                   background: training.cancelled ? 'var(--bg-raised)' : 'var(--bg-card)',
                   border: training.cancelled
                     ? '1px solid rgba(248,113,113,0.25)'
                     : '1px solid var(--border)',
                   opacity: training.cancelled ? 0.7 : 1,
                 }}>

              {/* Cancelled banner */}
              {training.cancelled && (
                <div className="flex items-center gap-2 px-4 py-2"
                     style={{ background: 'rgba(248,113,113,0.10)', borderBottom: '1px solid rgba(248,113,113,0.20)' }}>
                  <Ban size={13} style={{ color: '#f87171' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#f87171' }}>
                    Aflyst
                  </span>
                </div>
              )}

              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-base leading-tight"
                       style={{
                         color: training.cancelled ? 'var(--text-muted)' : 'var(--text-primary)',
                         textDecoration: training.cancelled ? 'line-through' : 'none',
                       }}>
                      {fmtLong(training.date)}
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
                  {!training.cancelled && (
                    <button onClick={() => setExpandedId(isExpanded ? null : training.id)}
                      className="flex items-center gap-1.5 shrink-0 active:opacity-60 transition-opacity"
                      aria-label="Vis tilmeldte">
                      <UserCheck size={15} style={{
                        color: training.attendance.length > 0 ? 'var(--accent)' : 'var(--text-faint)'
                      }} />
                      <span className="text-sm font-bold tabular-nums" style={{
                        color: training.attendance.length > 0 ? 'var(--accent)' : 'var(--text-faint)'
                      }}>
                        {training.attendance.length + training.guests.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {myPlayerId !== '' && !showPicker && !training.cancelled && (
                <div className="px-4 pb-4">
                  {isSignedUp ? (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1"
                           style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)' }}>
                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                        <span className="text-green-400 font-semibold text-sm">Tilmeldt</span>
                      </div>
                      <button onClick={() => cancelSignUp(training.id, myPlayerId)}
                        className="shrink-0 text-xs font-semibold px-3 py-2.5 rounded-xl active:opacity-70 transition-opacity"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}>
                        Afmeld
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => signUp(training.id, myPlayerId)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
                      style={{ background: 'var(--cta-bg)', color: 'var(--cta-color)', boxShadow: '0 4px 14px var(--cta-shadow)' }}>
                      Tilmeld mig
                    </button>
                  )}
                </div>
              )}

              {isExpanded && (
                <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--border-faint)' }}>
                  {training.attendance.length === 0 && training.guests.length === 0 ? (
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
                          <div key={id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                               style={{ background: isMe ? 'rgba(149,197,233,0.07)' : 'var(--bg-raised)' }}>
                            <PlayerAvatar name={name} size="sm" />
                            <span className="text-sm font-medium"
                                  style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                              {name}
                              {isMe && <span className="ml-1.5 text-xs font-normal" style={{ color: 'rgba(149,197,233,0.60)' }}>(dig)</span>}
                            </span>
                          </div>
                        )
                      })}
                      {training.guests.map((g) => (
                        <div key={g.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                             style={{ background: 'var(--bg-raised)' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                               style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <UserPlus size={13} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {g.name ?? 'Gæst'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* ── Forrige træninger ─────────────────────────────────────────── */}
        {!loading && pastTrainings.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-2 px-1"
               style={{ color: 'var(--text-faint)' }}>
              Forrige træninger
            </p>
            <div className="space-y-2">
              {pastTrainings.map((training) => {
                const total    = training.attendance.length + training.guests.length
                const rejected = !training.cancelled && total < THRESHOLD
                const reason   = training.cancelled
                  ? 'Træning aflyst'
                  : `Aflyst – kun ${total} af ${THRESHOLD} tilmeldte`
                const isAflyst = training.cancelled || rejected

                return (
                  <div key={training.id} className="rounded-2xl overflow-hidden"
                       style={{
                         background: 'var(--bg-raised)',
                         border: isAflyst
                           ? '1px solid rgba(248,113,113,0.22)'
                           : '1px solid var(--border)',
                         opacity: 0.75,
                       }}>
                    {isAflyst && (
                      <div className="flex items-center gap-2 px-4 py-2"
                           style={{ background: 'rgba(248,113,113,0.10)', borderBottom: '1px solid rgba(248,113,113,0.15)' }}>
                        <Ban size={12} style={{ color: '#f87171' }} />
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#f87171' }}>
                          {reason}
                        </span>
                      </div>
                    )}
                    <div className="px-4 py-3">
                      <p className="font-semibold text-sm leading-tight"
                         style={{
                           color: isAflyst ? 'var(--text-muted)' : 'var(--text-primary)',
                           textDecoration: isAflyst ? 'line-through' : 'none',
                         }}>
                        {fmtLong(training.date)}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} style={{ color: 'var(--text-faint)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{training.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={11} style={{ color: 'var(--text-faint)' }} />
                          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{training.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── NextTrainingCard ───────────────────────────────────────────────────────────

interface NextCardProps {
  training:      Training
  players:       Player[]
  myPlayerId:    string
  isSignedUp:    boolean
  showActions:   boolean
  onSignUp:      () => void
  onCancel:      () => void
  onAddGuest:    (name?: string) => void
  onRemoveGuest: () => void
}

function NextTrainingCard({
  training, players, myPlayerId, isSignedUp, showActions,
  onSignUp, onCancel, onAddGuest, onRemoveGuest,
}: NextCardProps) {
  // Live clock — updates every minute so the countdown stays current
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Guest UI state
  const [showGuestInput, setShowGuestInput]     = useState(false)
  const [guestName, setGuestName]               = useState('')
  const [showAttendeeList, setShowAttendeeList] = useState(false)

  const myGuest    = training.guests.find((g) => g.addedBy === myPlayerId)
  const total      = training.attendance.length + training.guests.length
  const state      = attState(total)
  const color      = STATE_COLOR[state]
  const fillPct    = Math.min((total / THRESHOLD) * 100, 100)
  const social     = buildSocialLabel(training.attendance, players, myPlayerId)
  const avatarIds  = training.attendance.slice(0, 5)
  const overflow   = total - avatarIds.length   // includes guests in overflow count

  // Deadline
  const deadlinePassed = isDeadlinePassed(training.date)
  const minsLeft       = deadlinePassed ? 0 : minutesToDeadline(training.date)
  const confirmed      = deadlinePassed && total >= THRESHOLD
  const rejected       = deadlinePassed && total < THRESHOLD

  // Card border reflects state — red/amber/green tint
  const borderColor = confirmed
    ? 'rgba(74,222,128,0.28)'
    : rejected
    ? 'rgba(248,113,113,0.28)'
    : `${color}40`

  // Cancelled or rejected (deadline passed + too few players) — same clear treatment
  if (training.cancelled || rejected) {
    const reason = training.cancelled
      ? 'Træning aflyst'
      : `Aflyst – kun ${total} af ${THRESHOLD} tilmeldte`
    return (
      <div className="rounded-2xl overflow-hidden"
           style={{ background: 'var(--bg-raised)', border: '1px solid rgba(248,113,113,0.30)', opacity: 0.85 }}>
        {/* Red banner */}
        <div className="flex items-center gap-2 px-4 py-2.5"
             style={{ background: 'rgba(248,113,113,0.14)', borderBottom: '1px solid rgba(248,113,113,0.22)' }}>
          <Ban size={14} style={{ color: '#f87171' }} />
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#f87171' }}>
            {reason}
          </span>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171' }}>
              Næste træning
            </span>
          </div>
          <p className="font-bold text-base leading-tight mt-1.5"
             style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
            {fmtLong(training.date)}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1.5">
              <Clock size={12} style={{ color: 'var(--text-faint)' }} />
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{training.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={12} style={{ color: 'var(--text-faint)' }} />
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{training.location}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: 'var(--bg-card)', border: `1px solid ${borderColor}` }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md"
                style={{ background: `${color}18`, color }}>
            Næste træning
          </span>

          {/* Deadline countdown OR confirmed/rejected pill */}
          {confirmed ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
              Træning bekræftet
            </span>
          ) : rejected ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
              For få tilmeldte
            </span>
          ) : (
            <span className="text-[10px] font-semibold flex items-center gap-1"
                  style={{ color: 'var(--text-muted)' }}>
              <Clock size={10} />
              Svarfrist om {formatCountdown(minsLeft)}
            </span>
          )}
        </div>

        <p className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
          {fmtLong(training.date)}
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

      {/* ── Progress section ─────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 rounded-xl p-3.5"
           style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}>
        {/* State label + count */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs font-bold" style={{ color }}>
              {confirmed ? 'Holdet er samlet' : rejected ? 'For få tilmeldte' : STATE_LABEL[state]}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {total} / {THRESHOLD}
            </span>
            {training.guests.length > 0 && (
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {training.attendance.length} spiller{training.attendance.length !== 1 ? 'e' : ''} + {training.guests.length} gæst{training.guests.length !== 1 ? 'er' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border)' }}>
          <div className="h-full rounded-full" style={{
            width:      `${fillPct}%`,
            background: color,
            transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1), background 400ms ease',
            boxShadow:  `0 0 8px ${color}60`,
          }} />
        </div>

        {/* Microcopy */}
        <p className="text-xs mt-2 leading-snug" style={{ color: 'var(--text-muted)' }}>
          {confirmed
            ? 'God træning!'
            : rejected
            ? `Kun ${total} af ${THRESHOLD} nødvendige – træning aflyst`
            : getMicrocopy(total, isSignedUp)}
        </p>
      </div>

      {/* ── Social layer — tappable, expands to full attendee list ─────── */}
      {total > 0 && (
        <>
          <button
            onClick={() => setShowAttendeeList((v) => !v)}
            className="w-full px-4 pt-3 flex items-center gap-2.5 active:opacity-70 transition-opacity"
          >
            {/* Stacked avatars */}
            <div className="flex items-center shrink-0">
              {avatarIds.map((id, i) => {
                const player = players.find((p) => p.id === id)
                const name   = player?.name ?? 'Ukendt'
                return (
                  <div key={id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: avatarIds.length - i, position: 'relative' }}>
                    <PlayerAvatar name={name} size="sm" />
                  </div>
                )
              })}
              {overflow > 0 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                     style={{ marginLeft: -8, zIndex: 0, background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  +{overflow}
                </div>
              )}
            </div>

            {/* Summary label + chevron */}
            <p className="text-xs leading-snug flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
              {social}
            </p>
            <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>
              {showAttendeeList ? '▲' : '▼'}
            </span>
          </button>

          {/* Expanded attendee list */}
          {showAttendeeList && (
            <div className="mx-4 mt-2 rounded-xl overflow-hidden"
                 style={{ border: '1px solid var(--border-faint)' }}>
              {training.attendance.map((id, i) => {
                const player = players.find((p) => p.id === id)
                const name   = player?.name ?? 'Ukendt spiller'
                const isMe   = id === myPlayerId
                // Find any guest this player brought
                const theirGuest = training.guests.find((g) => g.addedBy === id)
                return (
                  <div key={id}>
                    {/* Player row */}
                    <div
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{
                        background:  isMe ? 'rgba(149,197,233,0.07)' : 'var(--bg-raised)',
                        borderTop:   i > 0 ? '1px solid var(--border-faint)' : undefined,
                      }}
                    >
                      <PlayerAvatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate"
                              style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {name}
                          {isMe && (
                            <span className="ml-1.5 text-xs font-normal"
                                  style={{ color: 'rgba(149,197,233,0.60)' }}>
                              (dig)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Guest row — indented under their player */}
                    {theirGuest && (
                      <div className="flex items-center gap-3 px-3 py-2"
                           style={{
                             background:  'var(--bg-raised)',
                             borderTop:   '1px solid var(--border-faint)',
                             paddingLeft: 52,   // align with player name
                           }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                             style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                          <UserPlus size={11} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {theirGuest.name
                            ? <><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{theirGuest.name}</span> <span style={{ color: 'var(--text-faint)' }}>(gæst)</span></>
                            : <span style={{ color: 'var(--text-muted)' }}>Navnløs gæst</span>
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Any orphaned guests (edge case) */}
              {training.guests
                .filter((g) => !training.attendance.includes(g.addedBy))
                .map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-3 py-2.5"
                       style={{ borderTop: '1px solid var(--border-faint)', background: 'var(--bg-raised)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                      <UserPlus size={13} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {g.name ?? 'Navnløs gæst'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {showActions && (
        <div className="px-4 py-4 space-y-2.5">
          {isSignedUp ? (
            <>
              {/* Signed-up row */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-xl px-3 py-3 flex-1"
                     style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)' }}>
                  <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                  <span className="text-green-400 font-bold text-sm">Du er tilmeldt</span>
                </div>
                <button onClick={onCancel}
                  className="shrink-0 text-xs font-semibold px-3 py-3 rounded-xl active:opacity-70 transition-opacity"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)' }}>
                  Afmeld
                </button>
              </div>

              {/* Guest section */}
              {myGuest ? (
                /* Guest added — show it with remove button */
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                     style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                  <UserPlus size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
                    Gæst: <span style={{ color: 'var(--text-primary)' }}>{myGuest.name ?? 'Navnløs gæst'}</span>
                  </span>
                  <button onClick={onRemoveGuest}
                    className="active:opacity-60 transition-opacity"
                    aria-label="Fjern gæst">
                    <X size={14} style={{ color: 'var(--text-faint)' }} />
                  </button>
                </div>
              ) : showGuestInput ? (
                /* Guest name input */
                <div className="rounded-xl overflow-hidden"
                     style={{ border: '1px solid var(--border)' }}>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onAddGuest(guestName || undefined)
                        setGuestName('')
                        setShowGuestInput(false)
                      }
                    }}
                    placeholder="Gæstens navn (valgfrit)"
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm bg-transparent outline-none"
                    style={{ color: 'var(--text-primary)', background: 'var(--bg-raised)' }}
                  />
                  <div className="flex border-t" style={{ borderColor: 'var(--border-faint)' }}>
                    <button onClick={() => { setShowGuestInput(false); setGuestName('') }}
                      className="flex-1 py-2 text-xs font-semibold active:opacity-70"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)' }}>
                      Annuller
                    </button>
                    <button
                      onClick={() => { onAddGuest(guestName || undefined); setGuestName(''); setShowGuestInput(false) }}
                      className="flex-1 py-2 text-xs font-bold active:opacity-70"
                      style={{ color: 'var(--accent)', background: 'var(--bg-raised)', borderLeft: '1px solid var(--border-faint)' }}>
                      Tilføj gæst
                    </button>
                  </div>
                </div>
              ) : (
                /* Add guest button */
                <button onClick={() => setShowGuestInput(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <UserPlus size={14} />
                  Tilføj gæst
                </button>
              )}
            </>
          ) : (
            /* Not signed up */
            <button onClick={onSignUp}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
              style={{
                background: state === 'high'
                  ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                  : 'var(--cta-bg)',
                color:      state === 'high' ? '#000' : 'var(--cta-color)',
                boxShadow:  state === 'high'
                  ? '0 4px 16px rgba(251,191,36,0.30)'
                  : '0 4px 14px var(--cta-shadow)',
              }}>
              {getCtaLabel(state)}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
