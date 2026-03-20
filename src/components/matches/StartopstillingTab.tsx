import { ArrowUp, ArrowDown, Users } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'

const MAX_STARTERS = 7

interface Props {
  matchId: string
}

// ── Shared player row ─────────────────────────────────────────────────────────

interface PlayerRowProps {
  id: string
  name: string
  isHighlighted?: boolean
  badge?: React.ReactNode
  action?: React.ReactNode
}

function PlayerRow({ id: _id, name, isHighlighted, badge, action }: PlayerRowProps) {
  const initial = name.split(' ')[0][0]?.toUpperCase() ?? '?'

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: isHighlighted ? 'rgba(74,222,128,0.07)' : '#1a1d27',
        border:     isHighlighted ? '1px solid rgba(74,222,128,0.2)' : '1px solid transparent',
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black text-white"
        style={{
          background: isHighlighted ? 'rgba(74,222,128,0.25)' : 'rgba(249,115,22,0.12)',
          border:     isHighlighted ? '1.5px solid rgba(74,222,128,0.4)' : '1px solid rgba(249,115,22,0.2)',
        }}
      >
        {initial}
      </div>
      <span className={`flex-1 text-sm font-medium truncate ${isHighlighted ? 'text-green-300' : 'text-white'}`}>
        {name}
      </span>
      {badge}
      {action}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StartopstillingTab({ matchId }: Props) {
  const match         = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const addStarter    = useMatchStore((s) => s.addStarter)
  const removeStarter = useMatchStore((s) => s.removeStarter)
  const players       = usePlayerStore((s) => s.players)
  const isAdmin       = useAuthStore((s) => s.isAdmin)

  if (!match) return null

  const attendance = match.attendance ?? []
  // Only show starters who are still signed up
  const starters   = (match.starters ?? []).filter((id) => attendance.includes(id))
  // Bench = signed-up players not in starters
  const bench      = attendance.filter((id) => !starters.includes(id))

  const startersFull = starters.length >= MAX_STARTERS

  const resolveName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? 'Ukendt spiller'

  // ── Empty state (no signups yet) ─────────────────────────────────────────────

  if (attendance.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users size={32} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm">Ingen tilmeldte spillere endnu</p>
        <p className="text-xs mt-1 text-slate-600">Spillere tilmeldes under "Tilmelding"</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Startopstilling ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">
            Startopstilling
            <span className="text-slate-500 font-normal ml-1.5">({starters.length}/{MAX_STARTERS})</span>
          </h3>
          {startersFull && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
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
            <p className="text-slate-500 text-sm">Ingen spillere valgt endnu</p>
            {isAdmin && attendance.length > 0 && (
              <p className="text-slate-600 text-xs mt-1">Tilføj spillere fra bænken herunder</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {starters.map((id) => (
              <PlayerRow
                key={id}
                id={id}
                name={resolveName(id)}
                isHighlighted
                badge={
                  !isAdmin ? (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
                    >
                      Starter
                    </span>
                  ) : undefined
                }
                action={
                  isAdmin ? (
                    <button
                      onClick={() => removeStarter(matchId, id)}
                      title="Flyt til bænken"
                      className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 active:bg-slate-700 rounded-lg px-2.5 py-1.5 transition-colors shrink-0"
                    >
                      <ArrowDown size={12} />
                      Bænk
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bænken ──────────────────────────────────────────────── */}
      <div>
        <h3 className="text-white font-bold text-sm mb-3">
          Bænken
          <span className="text-slate-500 font-normal ml-1.5">({bench.length})</span>
        </h3>

        {bench.length === 0 ? (
          <div
            className="text-center py-5 rounded-2xl border border-dashed border-white/10"
            style={{ background: '#1a1d27' }}
          >
            <p className="text-slate-500 text-sm">Alle tilmeldte er i startopstillingen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bench.map((id) => (
              <PlayerRow
                key={id}
                id={id}
                name={resolveName(id)}
                badge={
                  !isAdmin ? (
                    <span className="text-slate-500 text-xs bg-slate-800 rounded-full px-2 py-0.5 shrink-0">
                      Bænk
                    </span>
                  ) : undefined
                }
                action={
                  isAdmin ? (
                    <button
                      onClick={() => !startersFull && addStarter(matchId, id)}
                      disabled={startersFull}
                      title={startersFull ? 'Max 7 spillere i startopstillingen' : 'Tilføj til startopstillingen'}
                      className="flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: startersFull ? 'rgba(255,255,255,0.05)' : 'rgba(249,115,22,0.15)',
                        color:      startersFull ? '#64748b' : '#fb923c',
                      }}
                    >
                      <ArrowUp size={12} />
                      Opstilling
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
