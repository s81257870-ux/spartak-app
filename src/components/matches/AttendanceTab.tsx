import { useState } from 'react'
import { UserCheck, X } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'

interface Props {
  matchId: string
}

export default function AttendanceTab({ matchId }: Props) {
  const match = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const signUp = useMatchStore((s) => s.signUp)
  const cancelSignUp = useMatchStore((s) => s.cancelSignUp)
  const players = usePlayerStore((s) => s.players)

  const [selectedId, setSelectedId] = useState('')

  if (!match) return null

  const attendance = match.attendance ?? []

  // Map each attendance ID to a player object (or null if not found)
  const signedUpEntries = attendance.map((id) => ({
    id,
    player: players.find((p) => p.id === id) ?? null,
  }))

  const isAlreadySignedUp = selectedId !== '' && attendance.includes(selectedId)

  const handleSignUp = () => {
    if (!selectedId || isAlreadySignedUp) return
    signUp(matchId, selectedId)
    setSelectedId('')
  }

  return (
    <div className="space-y-5">

      {/* ── Signup form ─────────────────────────────────────── */}
      <div className="bg-[#1a1d27] rounded-2xl p-4 space-y-3">
        <h3 className="text-white font-bold text-sm">Tilmelding</h3>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Vælg dit navn</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-[#0f1117] border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-orange-500/50"
          >
            <option value="">Vælg dit navn...</option>
            {players.map((p) => {
              const alreadyIn = attendance.includes(p.id)
              return (
                <option key={p.id} value={p.id} disabled={alreadyIn}>
                  {p.name}{alreadyIn ? ' ✓' : ''}
                </option>
              )
            })}
          </select>
        </div>

        {isAlreadySignedUp && (
          <p className="text-orange-400 text-xs px-1">
            Du er allerede tilmeldt denne kamp.
          </p>
        )}

        <button
          onClick={handleSignUp}
          disabled={!selectedId || isAlreadySignedUp}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-30 active:scale-[0.98] transition-transform text-black"
          style={{
            background: (!selectedId || isAlreadySignedUp)
              ? undefined
              : 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
            boxShadow: (!selectedId || isAlreadySignedUp)
              ? undefined
              : '0 4px 14px rgba(249,115,22,0.28)',
          }}
        >
          Tilmeld mig
        </button>
      </div>

      {/* ── Signed up players list ──────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={14} className="text-orange-400" />
          <h3 className="text-white font-bold text-sm">
            Tilmeldte spillere
            <span className="text-slate-500 font-normal ml-1.5">({signedUpEntries.length})</span>
          </h3>
        </div>

        {signedUpEntries.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-[#1a1d27] rounded-2xl">
            <UserCheck size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Ingen tilmeldinger endnu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Bench section header */}
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-1 mb-1">
              Bænken
            </p>
            {signedUpEntries.map(({ id, player }) => {
              const fullName = player?.name ?? 'Ukendt spiller'
              const initial = player?.name.split(' ')[0][0].toUpperCase() ?? '?'
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 bg-[#1a1d27] rounded-2xl px-4 py-3"
                >
                  {/* Avatar — first letter of first name */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white border border-orange-500/30"
                    style={{ background: 'rgba(249,115,22,0.15)' }}
                  >
                    {initial}
                  </div>

                  {/* Full name */}
                  <span className="flex-1 text-white text-sm font-medium">
                    {fullName}
                  </span>

                  {/* Placement badge */}
                  <span className="text-slate-500 text-xs bg-slate-800 rounded-full px-2 py-0.5 shrink-0">
                    Bænk
                  </span>

                  {/* Cancel button */}
                  <button
                    onClick={() => cancelSignUp(matchId, id)}
                    className="text-slate-600 active:text-red-400 transition-colors p-1 shrink-0"
                    aria-label="Afmeld"
                  >
                    <X size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
