import { useState } from 'react'
import { UserCheck, CheckCircle2, ChevronDown } from 'lucide-react'
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
      <div className="bg-[#1a1d27] rounded-2xl p-4 space-y-4">

        {/* Player identity */}
        {showPicker ? (
          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">Vælg dit navn</label>
            <div className="relative">
              <select
                value={myPlayerId}
                onChange={(e) => selectPlayer(e.target.value)}
                className="w-full appearance-none bg-[#0f1117] border border-white/10 text-white rounded-xl px-3 py-3 pr-9 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">Vælg dit navn...</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{attendance.includes(p.id) ? ' ✓' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white border border-orange-500/30"
              style={{ background: 'rgba(249,115,22,0.15)' }}
            >
              {myPlayer?.name.split(' ')[0][0].toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Du spiller som</p>
              <p className="text-white font-semibold text-sm truncate">{myPlayer?.name ?? 'Ukendt'}</p>
            </div>
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs text-slate-500 active:text-orange-400 transition-colors shrink-0 underline underline-offset-2"
            >
              Skift
            </button>
          </div>
        )}

        {/* Signup action — only "Tilmeld" CTA; "Afmeld" lives in the player row */}
        {!showPicker && myPlayerId !== '' && (
          isSignedUp ? (
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-3 border border-green-500/25"
              style={{ background: 'rgba(74,222,128,0.08)' }}
            >
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <span className="text-green-400 font-semibold text-sm">Du er tilmeldt</span>
            </div>
          ) : (
            <button
              onClick={() => signUp(matchId, myPlayerId)}
              className="w-full py-3 rounded-xl font-bold text-sm text-black active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                boxShadow:  '0 4px 14px rgba(249,115,22,0.28)',
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
          <UserCheck size={14} className="text-orange-400" />
          <h3 className="text-white font-bold text-sm">
            Tilmeldte spillere
            <span className="text-slate-500 font-normal ml-1.5">({attendance.length})</span>
          </h3>
        </div>

        {attendance.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-[#1a1d27] rounded-2xl">
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
                    background: isMe ? 'rgba(249,115,22,0.10)' : '#1a1d27',
                    border:     isMe ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
                  }}
                >
                  {/* Left: avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white"
                      style={{
                        background: isMe ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.12)',
                        border:     isMe ? '1.5px solid rgba(249,115,22,0.5)' : '1px solid rgba(249,115,22,0.2)',
                      }}
                    >
                      {initial}
                    </div>
                    <span className={`text-sm font-medium truncate ${isMe ? 'text-orange-300' : 'text-white'}`}>
                      {name}
                      {isMe && <span className="ml-1.5 text-orange-500/70 text-xs font-normal">(dig)</span>}
                    </span>
                  </div>

                  {/* Right: "Afmeld" only for the current player */}
                  {isMe && (
                    <button
                      onClick={() => cancelSignUp(matchId, id)}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-slate-400 border border-white/10 active:border-red-500/40 active:text-red-400"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
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
