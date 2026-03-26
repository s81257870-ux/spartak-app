import { useState } from 'react'
import { UserCheck, CheckCircle2 } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'

const MY_PLAYER_KEY = 'spartak_my_player_id'

interface Props {
  matchId: string
}

export default function AttendanceTab({ matchId }: Props) {
  const match        = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const signUp       = useMatchStore((s) => s.signUp)
  const cancelSignUp = useMatchStore((s) => s.cancelSignUp)
  const players      = usePlayerStore((s) => s.players)

  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem(MY_PLAYER_KEY) ?? ''
  )
  const [showPicker, setShowPicker] = useState<boolean>(myPlayerId === '')

  if (!match) return null

  const attendance = match.attendance ?? []
  const myPlayer   = players.find((p) => p.id === myPlayerId) ?? null
  const isSignedUp = myPlayerId !== '' && attendance.includes(myPlayerId)

  const selectPlayer = (id: string) => {
    setMyPlayerId(id)
    localStorage.setItem(MY_PLAYER_KEY, id)
    setShowPicker(false)
  }

  return (
    <div className="space-y-5">

      {/* ── Signup card ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 space-y-4"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
      >

        {/* Player identity */}
        {showPicker ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Hvem er du?
            </p>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const alreadyIn = attendance.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPlayer(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
                    style={{
                      background: alreadyIn ? 'rgba(74,222,128,0.10)' : 'var(--bg-input)',
                      border: alreadyIn
                        ? '1px solid rgba(74,222,128,0.25)'
                        : '1px solid var(--border-input)',
                      color: alreadyIn ? '#4ade80' : 'var(--text-primary)',
                    }}
                  >
                    {alreadyIn && <CheckCircle2 size={11} />}
                    {p.name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-black"
              style={{
                background: 'rgba(149,197,233,0.13)',
                border: '1px solid rgba(149,197,233,0.30)',
                color: 'white',
              }}
            >
              {myPlayer?.name.split(' ')[0][0].toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold"
                 style={{ color: 'var(--text-faint)' }}>
                Du spiller som
              </p>
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {myPlayer?.name ?? 'Ukendt'}
              </p>
            </div>
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs transition-colors shrink-0 underline underline-offset-2 active:opacity-60"
              style={{ color: 'var(--text-muted)' }}
            >
              Skift
            </button>
          </div>
        )}

        {/* Signup action — only "Tilmeld" CTA; "Afmeld" lives in the player row */}
        {!showPicker && myPlayerId !== '' && (
          isSignedUp ? (
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-3"
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.25)',
              }}
            >
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <span className="text-green-400 font-semibold text-sm">Du er tilmeldt</span>
            </div>
          ) : (
            <button
              onClick={() => signUp(matchId, myPlayerId)}
              className="w-full py-3 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
              style={{
                background: 'var(--cta-bg)',
                color:      'var(--cta-color)',
                boxShadow:  '0 4px 14px var(--cta-shadow)',
              }}
            >
              Tilmeld mig
            </button>
          )
        )}
      </div>

      {/* ── Tilmeldte spillere ────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={14} style={{ color: 'var(--accent)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Tilmeldte spillere
            <span className="font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
              ({attendance.length})
            </span>
          </h3>
        </div>

        {attendance.length === 0 ? (
          <div
            className="text-center py-8 rounded-2xl"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
          >
            <UserCheck size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Ingen tilmeldinger endnu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendance.map((id) => {
              const player  = players.find((p) => p.id === id)
              const name    = player?.name ?? 'Ukendt spiller'
              const initial = player?.name.split(' ')[0][0].toUpperCase() ?? '?'
              const isMe    = id === myPlayerId

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: isMe ? 'rgba(149,197,233,0.08)' : 'var(--bg-raised)',
                    border:     isMe
                      ? '1px solid rgba(149,197,233,0.22)'
                      : '1px solid var(--border)',
                  }}
                >
                  {/* Left: avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black"
                      style={{
                        background: isMe ? 'rgba(149,197,233,0.22)' : 'rgba(149,197,233,0.10)',
                        border:     isMe ? '1.5px solid rgba(149,197,233,0.50)' : '1px solid rgba(149,197,233,0.18)',
                        color: 'white',
                      }}
                    >
                      {initial}
                    </div>
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}
                    >
                      {name}
                      {isMe && (
                        <span className="ml-1.5 text-xs font-normal"
                              style={{ color: 'rgba(149,197,233,0.65)' }}>
                          (dig)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Right: "Afmeld" only for the current player */}
                  {isMe && (
                    <button
                      onClick={() => cancelSignUp(matchId, id)}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors active:border-red-500/40 active:text-red-400"
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-input)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Afmeld
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
