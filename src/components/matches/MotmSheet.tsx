import { Star } from 'lucide-react'
import type { Match, Player } from '../../types'
import PlayerAvatar from '../players/PlayerAvatar'

interface Props {
  match: Match
  players: Player[]
  currentMotm: string | null
  onSelect: (playerId: string) => void
  onSkip: () => void
}

export default function MotmSheet({ match, players, currentMotm, onSelect, onSkip }: Props) {
  // Only show players who attended the match
  const attendees = players.filter(
    (p) =>
      match.attendance.includes(p.id) ||
      Object.values(match.lineup).includes(p.id) ||
      match.bench?.includes(p.id),
  )

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-5 pb-10"
        style={{
          background:    'var(--bg-raised)',
          maxWidth:      480,
          maxHeight:     '80vh',
          display:       'flex',
          flexDirection: 'column',
        }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border-input)' }} />

        <div className="flex items-center gap-3 mb-5 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(234,179,8,0.12)' }}
          >
            <Star size={18} style={{ color: '#eab308' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Kampens spiller
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              vs. {match.opponent} · {match.scoreUs}–{match.scoreThem}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mx-5 px-5 space-y-2">
          {attendees.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-faint)' }}>
              Ingen spillere registreret til denne kamp
            </p>
          ) : (
            attendees.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelect(player.id)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-all"
                style={{
                  background: currentMotm === player.id
                    ? 'rgba(234,179,8,0.10)'
                    : 'var(--bg-card)',
                  border: currentMotm === player.id
                    ? '1px solid rgba(234,179,8,0.35)'
                    : '1px solid var(--border)',
                }}
              >
                <PlayerAvatar name={player.name} size="md" />
                <p className="font-semibold text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                  {player.name}
                </p>
                {currentMotm === player.id && (
                  <Star size={16} style={{ color: '#eab308' }} fill="#eab308" />
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={onSkip}
          className="mt-5 text-sm text-center w-full flex-shrink-0"
          style={{ color: 'var(--text-faint)' }}
        >
          Spring over
        </button>
      </div>
    </div>
  )
}
