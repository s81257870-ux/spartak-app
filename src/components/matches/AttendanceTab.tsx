import { useState } from 'react'
import { UserCheck, CheckCircle2, ShieldAlert, UserMinus } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import PlayerAvatar from '../players/PlayerAvatar'
import { isOversidder } from '../../utils/matchTime'
import { displayName } from '../../utils/playerName'

const MY_PLAYER_KEY  = 'spartak_my_player_id'
const SQUAD_LIMIT    = 10   // 7 starters + 3 subs (7v7)

interface Props {
  matchId: string
}

export default function AttendanceTab({ matchId }: Props) {
  const match           = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const signUp          = useMatchStore((s) => s.signUp)
  const cancelSignUp    = useMatchStore((s) => s.cancelSignUp)
  const getPlayerStats  = useMatchStore((s) => s.getPlayerStats)
  const players         = usePlayerStore((s) => s.players)
  const isAdmin         = useAuthStore((s) => s.isAdmin)

  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem(MY_PLAYER_KEY) ?? ''
  )
  const [showPicker,     setShowPicker]     = useState<boolean>(myPlayerId === '')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  if (!match) return null

  if (isOversidder(match)) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-faint)' }}>
        <p className="text-2xl mb-2">😴</p>
        <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Friuge</p>
        <p className="text-sm mt-1">Ingen kamp denne uge — vi har Oversidder.</p>
      </div>
    )
  }

  const attendance = match.attendance ?? []
  const myPlayer   = players.find((p) => p.id === myPlayerId) ?? null
  const isSignedUp = myPlayerId !== '' && attendance.includes(myPlayerId)

  const selectPlayer = (id: string) => {
    setMyPlayerId(id)
    localStorage.setItem(MY_PLAYER_KEY, id)
    setShowPicker(false)
  }

  const confirmRemovePlayer = players.find((p) => p.id === confirmRemoveId)

  return (
    <>
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
                      {displayName(p, players)}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <PlayerAvatar name={myPlayer?.name ?? '?'} size="md" />
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={14} style={{ color: 'var(--accent)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Tilmeldte
                <span className="font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
                  ({attendance.length}/{SQUAD_LIMIT})
                </span>
              </h3>
            </div>
            {attendance.length > 0 && (
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                Sorteret efter færrest kampe
              </span>
            )}
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
            <>
              {/* Sort by matchesPlayed ascending → fewest = highest rotation priority */}
              {(() => {
                const sorted = [...attendance]
                  .map((id) => ({
                    id,
                    player:        players.find((p) => p.id === id),
                    matchesPlayed: getPlayerStats(id).matchesPlayed,
                  }))
                  .sort((a, b) => a.matchesPlayed - b.matchesPlayed)

                const inSquad  = sorted.slice(0, SQUAD_LIMIT)
                const reserves = sorted.slice(SQUAD_LIMIT)

                const renderRow = (entry: typeof sorted[0], rank: number, isReserve: boolean) => {
                  const name  = entry.player?.name ?? 'Ukendt spiller'
                  const isMe  = entry.id === myPlayerId
                  const mp    = entry.matchesPlayed
                  const label = mp === 1 ? '1 kamp' : `${mp} kampe`

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                      style={{
                        background: isMe ? 'rgba(220,38,38,0.08)' : 'var(--bg-raised)',
                        border:     isMe
                          ? '1px solid rgba(220,38,38,0.22)'
                          : '1px solid var(--border)',
                      }}
                    >
                      {/* Left: rank badge + avatar + name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rotation rank number */}
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                          style={
                            isReserve
                              ? { background: 'rgba(252,138,74,0.10)', color: '#fc8a4a', border: '1px solid rgba(252,138,74,0.25)' }
                              : { background: 'rgba(74,222,128,0.10)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }
                          }
                        >
                          {rank}
                        </div>

                        <PlayerAvatar name={name} size="sm" />

                        <div className="min-w-0">
                          <span
                            className="text-sm font-medium block truncate"
                            style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}
                          >
                            {name}
                            {isMe && (
                              <span className="ml-1.5 text-xs font-normal"
                                    style={{ color: 'rgba(220,38,38,0.65)' }}>
                                (dig)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                            {label} i sæsonen
                          </span>
                        </div>
                      </div>

                      {/* Right: Afmeld (own row) | admin remove | reserve badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isMe && (
                          <button
                            onClick={() => cancelSignUp(matchId, entry.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors active:border-red-500/40 active:text-red-400"
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-input)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Afmeld
                          </button>
                        )}

                        {/* Admin remove button — shown for all players (even own row as extra option) */}
                        {isAdmin && (
                          <button
                            onClick={() => setConfirmRemoveId(entry.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                            style={{
                              background: 'rgba(220,38,38,0.08)',
                              border: '1px solid rgba(220,38,38,0.20)',
                            }}
                            title={`Fjern ${name}`}
                          >
                            <UserMinus size={13} style={{ color: 'var(--accent)' }} />
                          </button>
                        )}

                        {/* Reserve badge */}
                        {isReserve && (
                          <span
                            className="text-[10px] font-bold px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(252,138,74,0.10)', color: '#fc8a4a', border: '1px solid rgba(252,138,74,0.20)' }}
                          >
                            Reserve
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-2">
                    {inSquad.map((entry, i) => renderRow(entry, i + 1, false))}

                    {reserves.length > 0 && (
                      <>
                        {/* Divider */}
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                          <div className="flex items-center gap-1">
                            <ShieldAlert size={10} style={{ color: '#fc8a4a' }} />
                            <span className="text-[10px] font-bold" style={{ color: '#fc8a4a' }}>
                              Over kvoten ({reserves.length} reserve{reserves.length > 1 ? 'r' : ''})
                            </span>
                          </div>
                          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                        </div>
                        {reserves.map((entry, i) => renderRow(entry, SQUAD_LIMIT + i + 1, true))}
                      </>
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>

      {/* ── Admin: confirm remove sheet ───────────────────────────── */}
      {isAdmin && confirmRemoveId && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmRemoveId(null)}
        >
          <div
            className="w-full rounded-t-3xl px-5 pt-5 pb-10 space-y-5"
            style={{ background: 'var(--bg-raised)', maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border-input)' }} />

            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(220,38,38,0.10)' }}
              >
                <UserMinus size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Fjern spiller
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Dette er en administratorhandling
                </p>
              </div>
            </div>

            {/* Body */}
            <div
              className="rounded-2xl px-4 py-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Er du sikker på, at du vil fjerne{' '}
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {confirmRemovePlayer?.name ?? 'denne spiller'}
                </span>{' '}
                fra tilmeldingslisten?
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
                Spilleren kan tilmelde sig igen selv.
              </p>
            </div>

            <button
              onClick={() => {
                cancelSignUp(matchId, confirmRemoveId)
                setConfirmRemoveId(null)
              }}
              className="w-full py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
              style={{
                background: 'var(--accent)',
                color:      'white',
                boxShadow:  '0 6px 20px rgba(220,38,38,0.35)',
              }}
            >
              Ja, fjern {confirmRemovePlayer?.name.split(' ')[0] ?? 'spilleren'}
            </button>
            <button
              onClick={() => setConfirmRemoveId(null)}
              className="w-full py-3 rounded-2xl font-semibold text-sm"
              style={{
                background: 'var(--bg-card)',
                color:      'var(--text-secondary)',
                border:     '1px solid var(--border)',
              }}
            >
              Annuller
            </button>
          </div>
        </div>
      )}
    </>
  )
}
