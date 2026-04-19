import { useState } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import PlayerAvatar from '../players/PlayerAvatar'

interface Props {
  onSelect: (playerId: string) => void
  onDismiss: () => void
}

export default function IdentitySheet({ onSelect, onDismiss }: Props) {
  const players = usePlayerStore((s) => s.players)
  const [search, setSearch] = useState('')

  const sorted = [...players]
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'da'))

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-5 pb-10"
        style={{
          background:   'var(--bg-raised)',
          boxShadow:    '0 -8px 40px rgba(0,0,0,0.5)',
          maxWidth:     480,
          maxHeight:    '80vh',
          display:      'flex',
          flexDirection:'column',
        }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border-input)' }} />

        {/* Header */}
        <div className="mb-5 flex-shrink-0">
          <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hvem er du?
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Vælg dit navn for at komme i gang. Du kan altid skifte det senere.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4 flex-shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg dit navn…"
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none border"
            style={{
              background:   'var(--bg-input)',
              borderColor:  'var(--border-input)',
              color:        'var(--text-primary)',
            }}
          />
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto -mx-5 px-5 space-y-2">
          {sorted.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player.id)}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <PlayerAvatar name={player.name} size="md" />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {player.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {(player as { position?: string }).position ?? 'Spiller'}
                </p>
              </div>
            </button>
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-faint)' }}>
              Ingen spillere matchede "{search}"
            </p>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={onDismiss}
          className="mt-5 text-sm text-center w-full flex-shrink-0"
          style={{ color: 'var(--text-faint)' }}
        >
          Spring over — jeg er bare på besøg
        </button>
      </div>
    </div>
  )
}
