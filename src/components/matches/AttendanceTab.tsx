import { useState } from 'react'
import { UserCheck, X, CheckCircle2, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'

// ── localStorage key ──────────────────────────────────────────────────────────
const MY_PLAYER_KEY = 'spartak_my_player_id'
const MAX_STARTERS  = 7

interface Props {
  matchId: string
}

// ── Small reusable player row ─────────────────────────────────────────────────
interface PlayerRowProps {
  id: string
  name: string
  isMe: boolean
  action?: React.ReactNode    // primary admin action button (left of X)
  onCancel?: () => void       // X to cancel signup entirely
}

function PlayerRow({ id: _id, name, isMe, action, onCancel }: PlayerRowProps) {
  const initial = name.split(' ')[0][0]?.toUpperCase() ?? '?'

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
      style={{
        background:  isMe ? 'rgba(249,115,22,0.10)' : '#1a1d27',
        border:      isMe ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white"
        style={{
          background: isMe ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.12)',
          border:     isMe ? '1.5px solid rgba(249,115,22,0.5)' : '1px solid rgba(249,115,22,0.2)',
        }}
      >
        {initial}
      </div>

      {/* Name */}
      <span className={`flex-1 text-sm font-medium min-w-0 truncate ${isMe ? 'text-orange-300' : 'text-white'}`}>
        {name}
        {isMe && <span className="ml-1.5 text-orange-500/70 text-xs font-normal">(dig)</span>}
      </span>

      {/* Primary action (admin only) */}
      {action}

      {/* Cancel signup (X) */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-slate-600 active:text-red-400 transition-colors p-1 shrink-0"
          aria-label="Afmeld"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AttendanceTab({ matchId }: Props) {
  const match        = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const signUp       = useMatchStore((s) => s.signUp)
  const cancelSignUp = useMatchStore((s) => s.cancelSignUp)
  const addStarter   = useMatchStore((s) => s.addStarter)
  const removeStarter = useMatchStore((s) => s.removeStarter)
  const players      = usePlayerStore((s) => s.players)
  const isAdmin      = useAuthStore((s) => s.isAdmin)

  const [myPlayerId, setMyPlayerId] = useState<string>(
    () => localStorage.getItem(MY_PLAYER_KEY) ?? ''
  )
  const [showPicker, setShowPicker] = useState<boolean>(myPlayerId === '')

  if (!match) return null

  const attendance = match.attendance ?? []
  const starters   = (match.starters ?? []).filter((id) => attendance.includes(id)) // only show if also signed up
  const bench      = attendance.filter((id) => !starters.includes(id))              // attendance − starters

  const myPlayer   = players.find((p) => p.id === myPlayerId) ?? null
  const isSignedUp = myPlayerId !== '' && attendance.includes(myPlayerId)

  const resolveName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? 'Ukendt spiller'

  // ── Handlers ────────────────────────────────────────────────────────────────

  const selectPlayer = (id: string) => {
    setMyPlayerId(id)
    localStorage.setItem(MY_PLAYER_KEY, id)
    setShowPicker(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Signup card (unchanged) ───────────────────────────────── */}
      <div className="bg-[#1a1d27] rounded-2xl p-4 space-y-4">

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

        {!showPicker && myPlayerId !== '' && (
          isSignedUp ? (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2.5 rounded-xl px-3 py-3 border border-green-500/25"
                style={{ background: 'rgba(74,222,128,0.08)' }}
              >
                <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                <span className="text-green-400 font-semibold text-sm">Du er tilmeldt</span>
              </div>
              <button
                onClick={() => cancelSignUp(matchId, myPlayerId)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 border border-white/10 active:border-red-500/40 active:text-red-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Afmeld
              </button>
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

      {/* ── Startopstilling ───────────────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">
            Startopstilling
            <span className="text-slate-500 font-normal ml-1.5">
              ({starters.length}/{MAX_STARTERS})
            </span>
          </h3>
          {starters.length >= MAX_STARTERS && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
            >
              Hold fuldtalligt
            </span>
          )}
        </div>

        {starters.length === 0 ? (
          <div
            className="text-center py-6 rounded-2xl border border-dashed border-white/10"
            style={{ background: '#1a1d27' }}
          >
            <p className="text-slate-500 text-sm">Ingen spillere i startopstillingen</p>
            {isAdmin && (
              <p className="text-slate-600 text-xs mt-1">Tilføj spillere fra bænken herunder</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {starters.map((id) => {
              const name = resolveName(id)
              const isMe = id === myPlayerId
              return (
                <PlayerRow
                  key={id}
                  id={id}
                  name={name}
                  isMe={isMe}
                  action={
                    isAdmin ? (
                      <button
                        onClick={() => removeStarter(matchId, id)}
                        title="Fjern fra opstilling"
                        className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
                      >
                        <ArrowDown size={12} />
                        Bænk
                      </button>
                    ) : (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
                      >
                        Starter
                      </span>
                    )
                  }
                  onCancel={isAdmin ? () => cancelSignUp(matchId, id) : undefined}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bænken ────────────────────────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={14} className="text-slate-500" />
          <h3 className="text-white font-bold text-sm">
            Bænken
            <span className="text-slate-500 font-normal ml-1.5">({bench.length})</span>
          </h3>
        </div>

        {bench.length === 0 && attendance.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-[#1a1d27] rounded-2xl">
            <UserCheck size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Ingen tilmeldinger endnu</p>
          </div>
        ) : bench.length === 0 ? (
          <div
            className="text-center py-5 rounded-2xl border border-dashed border-white/10"
            style={{ background: '#1a1d27' }}
          >
            <p className="text-slate-500 text-sm">Alle tilmeldte er i startopstillingen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bench.map((id) => {
              const name = resolveName(id)
              const isMe = id === myPlayerId
              const startersFull = starters.length >= MAX_STARTERS

              return (
                <PlayerRow
                  key={id}
                  id={id}
                  name={name}
                  isMe={isMe}
                  action={
                    isAdmin ? (
                      <button
                        onClick={() => !startersFull && addStarter(matchId, id)}
                        disabled={startersFull}
                        title={startersFull ? 'Max 7 spillere i startopstillingen' : 'Tilføj til opstilling'}
                        className="flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: startersFull ? 'rgba(255,255,255,0.05)' : 'rgba(249,115,22,0.15)',
                          color:      startersFull ? '#64748b' : '#fb923c',
                        }}
                      >
                        <ArrowUp size={12} />
                        Opstilling
                      </button>
                    ) : (
                      <span className="text-slate-500 text-xs bg-slate-800 rounded-full px-2 py-0.5 shrink-0">
                        Bænk
                      </span>
                    )
                  }
                  onCancel={isAdmin ? () => cancelSignUp(matchId, id) : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
