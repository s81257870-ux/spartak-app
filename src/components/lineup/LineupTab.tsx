import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import type { Position, Player } from '../../types'
import { displayName, chipLabel } from '../../utils/playerName'
import { ChevronDown } from 'lucide-react'
import { FORMATIONS, FORMATION_CATEGORIES, DEFAULT_FORMATION, getFormation } from '../../data/formations'

interface Props {
  matchId: string
}

// ─── Player chip (avatar + name below) ───────────────────────────────────────

function PlayerChip({
  player,
  allPlayers,
  isDragging = false,
}: {
  player: Player
  allPlayers: Player[]
  isDragging?: boolean
}) {
  const label = chipLabel(player, allPlayers)
  // Use last name initials (up to 2 chars) for the avatar circle
  const lastName = player.name.trim().split(' ').pop() ?? player.name
  const avatarText = lastName.slice(0, 2).toUpperCase()

  return (
    <div className={`flex flex-col items-center gap-0.5 transition-opacity ${isDragging ? 'opacity-40' : ''}`}>
      <div
        className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-white text-[10px] shadow"
        style={{
          background: 'linear-gradient(135deg, #1e4a2e, #16361f)',
          borderColor: 'rgba(249,115,22,0.7)',
        }}
      >
        {avatarText}
      </div>
      <span className="text-white font-semibold text-[9px] leading-tight text-center w-14 truncate">
        {label}
      </span>
    </div>
  )
}

function DraggableChip({ player, allPlayers }: { player: Player; allPlayers: Player[] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: player.id })
  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, position: 'relative' as const }
    : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <PlayerChip player={player} allPlayers={allPlayers} isDragging={isDragging} />
    </div>
  )
}

// ─── Droppable pitch slot ─────────────────────────────────────────────────────

function PitchSlot({
  position,
  shortLabel,
  player,
  allPlayers,
  onRemove,
  isAdmin,
}: {
  position: Position
  shortLabel: string
  player: Player | undefined
  allPlayers: Player[]
  onRemove: () => void
  isAdmin: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${position}` })

  return (
    <div ref={setNodeRef} className="flex items-center justify-center">
      {player ? (
        <div className="relative">
          <DraggableChip player={player} allPlayers={allPlayers} />
          {isAdmin && (
            <button
              onClick={onRemove}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X size={8} strokeWidth={3} className="text-white" />
            </button>
          )}
        </div>
      ) : (
        <div
          className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
            isOver ? 'border-yellow-400 bg-yellow-900/30' : 'border-white/25 bg-white/5'
          }`}
        >
          <span className="text-white/40 text-[8px] font-bold">{shortLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── Droppable bench row ──────────────────────────────────────────────────────

function BenchZone({
  players,
  allPlayers,
  onRemove,
  isAdmin,
}: {
  players: Player[]
  allPlayers: Player[]
  onRemove: (id: string) => void
  isAdmin: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench' })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl px-3 py-2 min-h-[54px] transition-colors ${
        isOver ? 'bg-blue-900/30 border border-blue-500/40' : 'bg-[#1a1d27]'
      }`}
    >
      <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1.5 font-semibold">
        Bænk ({players.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <div key={p.id} className="relative">
            <DraggableChip player={p} allPlayers={allPlayers} />
            {isAdmin && (
              <button
                onClick={() => onRemove(p.id)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center"
              >
                <X size={8} strokeWidth={3} className="text-white" />
              </button>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-slate-600 text-[10px] italic">Træk spillere hertil</p>
        )}
      </div>
    </div>
  )
}

// ─── Available (not selected) zone ────────────────────────────────────────────

function AvailableZone({ players, allPlayers }: { players: Player[]; allPlayers: Player[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'available' })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl px-3 py-2 min-h-[46px] transition-colors ${
        isOver ? 'bg-slate-700/30 border border-slate-500/40' : 'bg-[#1a1d27]'
      }`}
    >
      <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1.5 font-semibold">
        Ikke udtaget ({players.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <DraggableChip key={p.id} player={p} allPlayers={allPlayers} />
        ))}
        {players.length === 0 && (
          <p className="text-slate-600 text-[10px] italic">Alle spillere er udtaget ✓</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LineupTab({ matchId }: Props) {
  const match = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const moveToLineup = useMatchStore((s) => s.moveToLineup)
  const moveToBench = useMatchStore((s) => s.moveToBench)
  const removeFromSquad = useMatchStore((s) => s.removeFromSquad)
  const setFormation = useMatchStore((s) => s.setFormation)
  const allPlayers = usePlayerStore((s) => s.players)

  const isAdmin = useAuthStore((s) => s.isAdmin)

  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [confirmFormation, setConfirmFormation] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  if (!match) return null

  const currentFormationId = match.formation ?? DEFAULT_FORMATION
  const formation = getFormation(currentFormationId)
  const maxRow = Math.max(...formation.slots.map((s) => s.row))
  const pitchHeight = Math.max(220, maxRow * 68)

  const starterIds = new Set(Object.values(match.lineup))
  const benchIds = new Set(match.bench)

  const getPlayerInSlot = (pos: Position) => {
    const pid = match.lineup[pos]
    return pid ? allPlayers.find((p) => p.id === pid) : undefined
  }

  const benchPlayers = allPlayers.filter((p) => benchIds.has(p.id))
  const availablePlayers = allPlayers.filter((p) => !starterIds.has(p.id) && !benchIds.has(p.id))

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActivePlayer(allPlayers.find((p) => p.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActivePlayer(null)
    if (!over || !isAdmin) return
    const playerId = active.id as string
    const target = over.id as string

    if (target === 'bench') {
      moveToBench(matchId, playerId)
    } else if (target === 'available') {
      removeFromSquad(matchId, playerId)
    } else if (target.startsWith('slot:')) {
      const position = target.replace('slot:', '') as Position
      moveToLineup(matchId, position, playerId)
    }
  }

  const handleFormationClick = (fId: string) => {
    if (fId === currentFormationId) return
    // If lineup already has players, ask for confirmation
    if (starterIds.size > 0 || benchIds.size > 0) {
      setConfirmFormation(fId)
    } else {
      setFormation(matchId, fId)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

      {/* ── Formation dropdown — admin only ──────────────────── */}
      {isAdmin ? (
        <div className="relative mb-3">
          <select
            value={currentFormationId}
            onChange={(e) => handleFormationClick(e.target.value)}
            className="w-full appearance-none bg-[#1a1d27] border border-white/10 text-white rounded-xl px-4 py-3 pr-10 text-sm font-semibold focus:outline-none focus:border-orange-500/50"
          >
            {FORMATION_CATEGORIES.map(({ id: cat, emoji }) => (
              <optgroup key={cat} label={`${emoji} ${cat}`}>
                {FORMATIONS.filter((f) => f.category === cat).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}  —  {f.description}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1a1d27] border border-white/[0.06]">
          <span className="text-white font-semibold text-sm flex-1">{formation.name}</span>
          <span className="text-slate-500 text-xs">{formation.description}</span>
        </div>
      )}

      {/* ── Confirmation dialog when switching formation ─────── */}
      {confirmFormation && (
        <div className="bg-orange-900/30 border border-orange-500/40 rounded-2xl p-4 mb-3 text-sm">
          <p className="text-orange-200 font-medium mb-3">
            Skift til <strong>{confirmFormation}</strong>? Det nulstiller den nuværende opstilling.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setFormation(matchId, confirmFormation); setConfirmFormation(null) }}
              className="flex-1 bg-orange-600 text-white rounded-xl py-2 font-bold text-sm"
            >
              Ja, skift
            </button>
            <button
              onClick={() => setConfirmFormation(null)}
              className="flex-1 bg-[#1a1d27] text-slate-300 rounded-xl py-2 font-bold text-sm border border-white/10"
            >
              Annuller
            </button>
          </div>
        </div>
      )}

      {/* ── Pitch ──────────────────────────────────────────────── */}
      {/* Constrained width to create the narrow portrait look */}
      <div className="flex justify-center mb-3">
        <div
          className="relative rounded-2xl overflow-hidden w-full"
          style={{
            maxWidth: '260px',
            height: `${pitchHeight}px`,
            background: 'linear-gradient(180deg, #1e4a2e 0%, #16361f 40%, #16361f 60%, #1e4a2e 100%)',
          }}
        >
          {/* Pitch markings */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 260 347"
            preserveAspectRatio="none"
          >
            {/* Outer border */}
            <rect x="8" y="8" width="244" height="331" rx="4" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"/>
            {/* Half-way line */}
            <line x1="8" y1="173" x2="252" y2="173" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            {/* Top goal box */}
            <rect x="72" y="8" width="116" height="42" rx="2" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            {/* Top 6-yard box */}
            <rect x="102" y="8" width="56" height="20" rx="1" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            {/* Bottom goal box */}
            <rect x="72" y="297" width="116" height="42" rx="2" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            {/* Bottom 6-yard box */}
            <rect x="102" y="319" width="56" height="20" rx="1" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            {/* Top penalty arc */}
            <path d="M 100 62 A 30 30 0 0 1 160 62" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1"/>
            {/* Bottom penalty arc */}
            <path d="M 100 285 A 30 30 0 0 0 160 285" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1"/>
            {/* Alternating grass stripes */}
            {Array.from({ length: maxRow + 1 }, (_, i) => (
              <rect key={i} x="8" y={8 + i * 55} width="244" height="55" fill="white" fillOpacity={i % 2 === 0 ? 0.025 : 0}/>
            ))}
          </svg>

          {/* Starter count badge */}
          <div className="absolute top-2 right-2 z-10 bg-black/50 rounded-full px-2 py-0.5">
            <span className="text-white text-[10px] font-bold">{starterIds.size}/7</span>
          </div>

          {/* 4-row × 3-col grid — rows 1-4 mapped to pitch rows */}
          <div
            className="absolute inset-0"
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${maxRow}, 1fr)`,
              gridTemplateColumns: 'repeat(3, 1fr)',
              padding: '8px',
            }}
          >
            {formation.slots.map(({ key, row, col }) => (
              <div
                key={key}
                style={{ gridRow: row, gridColumn: col }}
                className="flex items-center justify-center"
              >
                <PitchSlot
                  position={key}
                  shortLabel={key}
                  player={getPlayerInSlot(key)}
                  allPlayers={allPlayers}
                  onRemove={() => removeFromSquad(matchId, match.lineup[key])}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bench ─────────────────────────────────────────────── */}
      <div className="mb-2">
        <BenchZone
          players={benchPlayers}
          allPlayers={allPlayers}
          onRemove={(id) => removeFromSquad(matchId, id)}
          isAdmin={isAdmin}
        />
      </div>

      {/* ── Not selected — admin only ──────────────────────────── */}
      {isAdmin && (
        <div className="mb-2">
          <AvailableZone players={availablePlayers} allPlayers={allPlayers} />
        </div>
      )}

      {/* ── Collapsible legend ────────────────────────────────── */}
      <details className="bg-[#1a1d27] rounded-2xl overflow-hidden">
        <summary className="px-4 py-3 text-slate-400 text-[10px] uppercase tracking-wide font-semibold cursor-pointer list-none flex justify-between items-center">
          Startopstilling — {formation.name}
          <span className="text-slate-600">▾</span>
        </summary>
        <div className="px-4 pb-3 space-y-1.5">
          {formation.slots.map(({ key, label }) => {
            const player = getPlayerInSlot(key)
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className={`text-sm font-medium ${player ? 'text-white' : 'text-slate-700'}`}>
                  {player ? displayName(player, allPlayers) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </details>

      {/* Drag overlay */}
      <DragOverlay>
        {activePlayer && (
          <div className="opacity-90">
            <PlayerChip player={activePlayer} allPlayers={allPlayers} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
