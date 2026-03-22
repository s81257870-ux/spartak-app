/**
 * TrainingCard — Home page section for the next Monday training session.
 *
 * Identity:
 *   localStorage 'spartak_my_player_id' persists which player this device
 *   belongs to.  The identity bar shows "Du spiller som: [Full Name] · Skift".
 *   "Skift" clears the key so the user can re-identify.  In incognito (no key
 *   stored) the card starts with a "Hvem er du?" picker.
 *
 * Headcount = real attendance + active guests.  Both count toward MIN_PLAYERS.
 *
 * Guests are training-only slots (Gæst 1–5).  They are stored separately in
 * trainingStore.sessions[dateKey].guests and never touch the players roster.
 */

import { useState } from 'react'
import { Users, CheckCircle, UserPlus } from 'lucide-react'
import { useTrainingStore, TRAINING_GUESTS, type GuestId } from '../../store/trainingStore'
import { usePlayerStore }   from '../../store/playerStore'
import { nextTrainingDateKey, formatTrainingDate } from '../../utils/trainingDate'

const MIN_PLAYERS = 10

export default function TrainingCard() {
  const dateKey = nextTrainingDateKey()

  const { sessions, signUp, cancelSignUp, addGuest, removeGuest } = useTrainingStore()
  const players = usePlayerStore((s) => s.players)

  const session    = sessions[dateKey] ?? { attendance: [], guests: [] }
  const attendance = session.attendance
  const guests     = session.guests

  // Total headcount for threshold — real players + active guests
  const total        = attendance.length + guests.length
  const missingCount = Math.max(0, MIN_PLAYERS - total)
  const isOn         = total >= MIN_PLAYERS

  // ── Identity ───────────────────────────────────────────────────────
  // Same localStorage key as match attendance so picking yourself once
  // works across both features.
  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem('spartak_my_player_id') ?? ''
  )
  const [showPicker, setShowPicker] = useState(!myPlayerId)

  const myPlayer    = players.find((p) => p.id === myPlayerId)
  const isSignedUp  = !!myPlayerId && attendance.includes(myPlayerId)

  // Derived display lists
  const attendingPlayers = players
    .filter((p) => attendance.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  // ── Actions ────────────────────────────────────────────────────────

  function handlePickPlayer(playerId: string) {
    localStorage.setItem('spartak_my_player_id', playerId)
    setMyPlayerId(playerId)
    signUp(dateKey, playerId)    // sign up immediately on identification
    setShowPicker(false)
  }

  function handleSwitch() {
    // Clear identity — next render shows picker again
    localStorage.removeItem('spartak_my_player_id')
    setMyPlayerId('')
    setShowPicker(true)
  }

  function handleSignUp() {
    if (!myPlayerId) { setShowPicker(true); return }
    signUp(dateKey, myPlayerId)
  }

  function handleCancel() {
    if (!myPlayerId) return
    cancelSignUp(dateKey, myPlayerId)
  }

  function toggleGuest(guestId: GuestId) {
    if (guests.includes(guestId)) {
      removeGuest(dateKey, guestId)
    } else {
      addGuest(dateKey, guestId)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >

      {/* ── Header: date + status badge ───────────────────────────── */}
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
              ? { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.20)' }
              : { background: 'rgba(250,204,21,0.10)', color: '#facc15', border: '1px solid rgba(250,204,21,0.20)' }
          }
        >
          {isOn ? '✓ Træning er på' : `Mangler ${missingCount}`}
        </span>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-3">
        <Users size={12} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {total} / {MIN_PLAYERS} tilmeldt
        </p>
      </div>

      <div
        className="mt-1.5 rounded-full overflow-hidden"
        style={{ height: '3px', background: 'var(--bg-raised)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, (total / MIN_PLAYERS) * 100)}%`,
            background: isOn
              ? 'linear-gradient(90deg, #4ade80, #22c55e)'
              : 'linear-gradient(90deg, #facc15, #f97316)',
          }}
        />
      </div>

      {/* ── Identity bar / sign-up action ─────────────────────────── */}
      <div className="mt-3">
        {showPicker ? (
          /* ── Player picker ── */
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
            {/* Only show cancel if a player was previously known */}
            {myPlayer && (
              <button
                onClick={() => setShowPicker(false)}
                className="mt-2 text-[11px]"
                style={{ color: 'var(--text-faint)' }}
              >
                Annuller
              </button>
            )}
          </div>
        ) : (
          /* ── Identity bar + action ── */
          <div className="space-y-2.5">

            {/* "Du spiller som: [Name] · Skift" */}
            {myPlayer && (
              <div className="flex items-center justify-between">
                <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  Du spiller som:{' '}
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {myPlayer.name}
                  </span>
                </p>
                <button
                  onClick={handleSwitch}
                  className="text-[11px] font-semibold active:opacity-60 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Skift
                </button>
              </div>
            )}

            {/* Sign-up / cancel button */}
            {isSignedUp ? (
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
              <button
                onClick={handleSignUp}
                className="w-full py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform text-black"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
              >
                Tilmeld mig
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Guest slots ───────────────────────────────────────────── */}
      <div
        className="mt-3 pt-3"
        style={{ borderTop: '1px solid var(--border-faint)' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <UserPlus size={11} style={{ color: 'var(--text-faint)' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
             style={{ color: 'var(--text-muted)' }}>
            Tilføj gæst
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {TRAINING_GUESTS.map(({ id, label }) => {
            const active = guests.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggleGuest(id)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full active:scale-95 transition-all"
                style={
                  active
                    ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.30)' }
                    : { background: 'var(--bg-raised)',       color: 'var(--text-faint)', border: '1px solid var(--border-faint)' }
                }
              >
                {active ? `✓ ${label}` : `+ ${label}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tilmeldte list ────────────────────────────────────────── */}
      {(attendingPlayers.length > 0 || guests.length > 0) && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border-faint)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
             style={{ color: 'var(--text-muted)' }}>
            Tilmeldte
          </p>
          <div className="flex flex-wrap gap-1.5">
            {/* Real players */}
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

            {/* Active guests */}
            {TRAINING_GUESTS.filter(({ id }) => guests.includes(id)).map(({ id, label }) => (
              <span
                key={id}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.10)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.20)' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
