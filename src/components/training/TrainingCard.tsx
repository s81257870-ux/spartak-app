/**
 * TrainingCard — Home page section for the next Monday training session.
 *
 * Data flow:
 *   • nextTrainingDateKey() → "YYYY-MM-DD" key for the coming Monday
 *   • trainingStore.sessions[dateKey].attendance → list of signed-up playerIds
 *   • localStorage 'spartak_my_player_id' → which player the device belongs to
 *
 * Status logic:
 *   • attendance.length < MIN_PLAYERS  → "Mangler N spillere" (yellow)
 *   • attendance.length >= MIN_PLAYERS → "Træning er på" (green)
 */

import { useState } from 'react'
import { Users, CheckCircle } from 'lucide-react'
import { useTrainingStore } from '../../store/trainingStore'
import { usePlayerStore }   from '../../store/playerStore'
import { nextTrainingDateKey, formatTrainingDate } from '../../utils/trainingDate'

const MIN_PLAYERS = 10

export default function TrainingCard() {
  const dateKey = nextTrainingDateKey()

  const { sessions, signUp, cancelSignUp } = useTrainingStore()
  const players = usePlayerStore((s) => s.players)

  // Derive attendance for this session (default to empty if unseen week)
  const attendance = sessions[dateKey]?.attendance ?? []

  // "My player" persisted across visits — same localStorage key as match attendance
  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem('spartak_my_player_id') ?? ''
  )
  const [showPicker, setShowPicker] = useState(false)

  const isSignedUp   = !!myPlayerId && attendance.includes(myPlayerId)
  const missingCount = Math.max(0, MIN_PLAYERS - attendance.length)
  const isOn         = attendance.length >= MIN_PLAYERS

  const attendingPlayers = players
    .filter((p) => attendance.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  /* ── Actions ─────────────────────────────────────────────────────── */

  function handleSignUp() {
    if (!myPlayerId) { setShowPicker(true); return }
    signUp(dateKey, myPlayerId)
  }

  function handleCancel() {
    if (!myPlayerId) return
    cancelSignUp(dateKey, myPlayerId)
  }

  function handlePickPlayer(playerId: string) {
    localStorage.setItem('spartak_my_player_id', playerId)
    setMyPlayerId(playerId)
    signUp(dateKey, playerId)     // sign up immediately on identification
    setShowPicker(false)
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >

      {/* ── Header row: date + status badge ──────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-base leading-tight"
             style={{ color: 'var(--text-primary)' }}>
            Mandag · 19:30
          </p>
          <p className="text-sm mt-0.5 capitalize"
             style={{ color: 'var(--text-muted)' }}>
            {formatTrainingDate(dateKey)}
          </p>
        </div>

        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0 mt-0.5"
          style={
            isOn
              ? { background: 'rgba(74,222,128,0.12)',  color: '#4ade80', border: '1px solid rgba(74,222,128,0.20)'  }
              : { background: 'rgba(250,204,21,0.10)',  color: '#facc15', border: '1px solid rgba(250,204,21,0.20)'  }
          }
        >
          {isOn ? '✓ Træning er på' : `Mangler ${missingCount}`}
        </span>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-3">
        <Users size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {attendance.length} / {MIN_PLAYERS} tilmeldt
        </p>
      </div>

      <div
        className="mt-1.5 rounded-full overflow-hidden"
        style={{ height: '3px', background: 'var(--bg-raised)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, (attendance.length / MIN_PLAYERS) * 100)}%`,
            background: isOn
              ? 'linear-gradient(90deg, #4ade80, #22c55e)'
              : 'linear-gradient(90deg, #facc15, #f97316)',
          }}
        />
      </div>

      {/* ── Sign-up / cancel (or player picker) ──────────────────── */}
      <div className="mt-3">
        {showPicker ? (
          /* Player selector — shown when myPlayerId not yet set */
          <div>
            <p className="text-[11px] font-semibold mb-2"
               style={{ color: 'var(--text-muted)' }}>
              Hvem er du?
            </p>
            <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
              {[...players]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePickPlayer(p.id)}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm active:opacity-70 transition-opacity"
                    style={{ background: 'var(--bg-raised)', color: 'var(--text-primary)' }}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setShowPicker(false)}
              className="mt-2 text-[11px]"
              style={{ color: 'var(--text-faint)' }}
            >
              Annuller
            </button>
          </div>
        ) : isSignedUp ? (
          /* Already signed up — show green confirmation + Afmeld */
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium flex items-center gap-1.5 text-green-400">
              <CheckCircle size={13} />
              Du er tilmeldt
            </span>
            <button
              onClick={handleCancel}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-all"
              style={{
                background: 'rgba(248,113,113,0.10)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.20)',
              }}
            >
              Afmeld
            </button>
          </div>
        ) : (
          /* Not signed up */
          <button
            onClick={handleSignUp}
            className="w-full py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform text-black"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
          >
            Tilmeld mig
          </button>
        )}
      </div>

      {/* ── Signed-up player chips ────────────────────────────────── */}
      {attendingPlayers.length > 0 && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border-faint)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
             style={{ color: 'var(--text-muted)' }}>
            Tilmeldte
          </p>
          <div className="flex flex-wrap gap-1.5">
            {attendingPlayers.map((p) => {
              const isMe = p.id === myPlayerId
              return (
                <span
                  key={p.id}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={
                    isMe
                      ? { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.25)' }
                      : { background: 'var(--bg-raised)',       color: 'var(--text-secondary)', border: '1px solid var(--border-faint)' }
                  }
                >
                  {p.name.split(' ')[0]}
                </span>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
