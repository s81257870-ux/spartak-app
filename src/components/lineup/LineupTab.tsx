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
import { X, Users } from 'lucide-react'
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
  const lastName = player.name.trim().split(' ').pop() ?? player.name
  const avatarText = lastName.slice(0, 2).toUpperCase()

  return (
    <div className={`flex flex-col items-center gap-0.5 transition-opacity ${isDragging ? 'opacity-40' : ''}`}>
      <div
        className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-white text-[10px] shadow"
        style={{
          background: 'linear-gradient(135deg, #1e4a2e, #16361f)',
          borderColor: 'rgba(149,197,233,0.60)',
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
  // Do NOT apply transform here — DragOverlay renders the floating clone.
  // Applying transform to the original breaks hit-testing and creates a
  // second visual element fighting the overlay.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
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
            isOver ? 'border-yellow-400 bg-yellow-900/30' : 'border-white/25'
          }`}
          style={!isOver ? { background: 'var(--bg-input)' } : undefined}
        >
          <span className="text-white/40 text-[8px] font-bold">{shortLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── Droppable bench ──────────────────────────────────────────────────────────
// Bench = attendance players not currently on the pitch.
// No remove button here — cancelling attendance is done in the Tilmelding tab.

function BenchZone({
  players,
  allPlayers,
}: {
  players: Player[]
  allPlayers: Player[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench' })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl px-3 py-2 min-h-[54px] transition-colors ${
        isOver ? 'bg-blue-900/30 border border-blue-500/40' : ''
      }`}
      style={!isOver ? { background: 'var(--bg-raised)', border: '1px solid var(--border)' } : undefined}
    >
      <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1.5 font-semibold">
        Bænk ({players.length})
      </p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <DraggableChip key={p.id} player={p} allPlayers={allPlayers} />
        ))}
        {players.length === 0 && (
          <p className="text-slate-600 text-[10px] italic">Alle tilmeldte spillere er på banen</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LineupTab({ matchId }: Props) {
  const match          = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const moveToLineup   = useMatchStore((s) => s.moveToLineup)
  const moveToBench    = useMatchStore((s) => s.moveToBench)
  const clearLineupSlot = useMatchStore((s) => s.clearLineupSlot)
  const setFormation   = useMatchStore((s) => s.setFormation)
  const allPlayers     = usePlayerStore((s) => s.players)
  const isAdmin        = useAuthStore((s) => s.isAdmin)

  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [confirmFormation, setConfirmFormation] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  if (!match) return null

  // ── Source of truth: only attendance players are available ─────────────────
  const attendanceIds     = new Set(match.attendance ?? [])
  const attendancePlayers = allPlayers.filter((p) => attendanceIds.has(p.id))

  // Starter IDs — only those still in attendance (guards against stale IDs)
  const starterIds = new Set(
    Object.values(match.lineup).filter((pid) => attendanceIds.has(pid))
  )

  // Bench = attendance players not currently on the pitch
  const benchPlayers = attendancePlayers.filter((p) => !starterIds.has(p.id))

  // Resolve a pitch slot: return undefined if player left attendance (stale)
  const getPlayerInSlot = (pos: Position): Player | undefined => {
    const pid = match.lineup[pos]
    if (!pid || !attendanceIds.has(pid)) return undefined
    return allPlayers.find((p) => p.id === pid)
  }

  const currentFormationId = match.formation ?? DEFAULT_FORMATION
  const formation  = getFormation(currentFormationId)
  const maxRow     = Math.max(...formation.slots.map((s) => s.row))
  const pitchHeight = Math.max(220, maxRow * 68)

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActivePlayer(allPlayers.find((p) => p.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActivePlayer(null)
    if (!over || !isAdmin) return
    const playerId = active.id as string
    const target   = over.id as string

    // Only allow moves for attendance players
    if (!attendanceIds.has(playerId)) return

    if (target === 'bench') {
      // Remove from pitch — player returns to derived bench
      moveToBench(matchId, playerId)
    } else if (target.startsWith('slot:')) {
      const position = target.replace('slot:', '') as Position
      moveToLineup(matchId, position, playerId)
    }
  }

  // ── Formation change ────────────────────────────────────────────────────────

  const handleFormationClick = (fId: string) => {
    if (fId === currentFormationId) return
    // Ask for confirmation only if someone is already placed on the pitch
    if (starterIds.size > 0) {
      setConfirmFormation(fId)
    } else {
      setFormation(matchId, fId)
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (attendancePlayers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users size={32} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium">Ingen tilmeldte spillere endnu</p>
        <p className="text-xs mt-1 text-slate-600">Spillere vises her når de tilmelder sig under "Tilmelding"</p>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

      {/* ── Formation selector ─────────────────────────────────── */}
      {isAdmin ? (
        <div className="relative mb-3">
          <select
            value={currentFormationId}
            onChange={(e) => handleFormationClick(e.target.value)}
            className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-semibold focus:outline-none"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
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
        <div className="mb-3 flex items-center gap-2 px-4 py-3 rounded-xl"
             style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
          <span className="text-white font-semibold text-sm flex-1">{formation.name}</span>
          <span className="text-slate-500 text-xs">{formation.description}</span>
        </div>
      )}

      {/* ── Formation change confirmation ─────────────────────── */}
      {confirmFormation && (
        <div className="rounded-2xl p-4 mb-3 text-sm"
             style={{ background: 'rgba(149,197,233,0.06)', border: '1px solid rgba(149,197,233,0.20)' }}>
          <p className="font-medium mb-3" style={{ color: '#95C5E9' }}>
            Skift til <strong>{confirmFormation}</strong>? Placeringerne på banen nulstilles — tilmeldte spillere beholder deres plads på bænken.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setFormation(matchId, confirmFormation); setConfirmFormation(null) }}
              className="flex-1 rounded-xl py-2 font-bold text-sm"
              style={{ background: 'var(--cta-bg)', color: 'var(--cta-color)' }}
            >
              Ja, skift
            </button>
            <button
              onClick={() => setConfirmFormation(null)}
              className="flex-1 rounded-xl py-2 font-bold text-sm"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-input)' }}
            >
              Annuller
            </button>
          </div>
        </div>
      )}

      {/* ── Pitch ──────────────────────────────────────────────── */}
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
            <rect x="8" y="8" width="244" height="331" rx="4" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"/>
            <line x1="8" y1="173" x2="252" y2="173" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            <rect x="72" y="8" width="116" height="42" rx="2" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            <rect x="102" y="8" width="56" height="20" rx="1" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            <rect x="72" y="297" width="116" height="42" rx="2" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            <rect x="102" y="319" width="56" height="20" rx="1" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="1"/>
            <path d="M 100 62 A 30 30 0 0 1 160 62" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1"/>
            <path d="M 100 285 A 30 30 0 0 0 160 285" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="1"/>
            {Array.from({ length: maxRow + 1 }, (_, i) => (
              <rect key={i} x="8" y={8 + i * 55} width="244" height="55" fill="white" fillOpacity={i % 2 === 0 ? 0.025 : 0}/>
            ))}
          </svg>

          {/* Starter count */}
          <div className="absolute top-2 right-2 z-10 bg-black/50 rounded-full px-2 py-0.5">
            <span className="text-white text-[10px] font-bold">{starterIds.size}/7</span>
          </div>

          {/* Grid */}
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
                  // X on pitch: just remove from slot — player returns to derived bench
                  onRemove={() => clearLineupSlot(matchId, key)}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bench (derived: attendance − pitch) ───────────────── */}
      <div className="mb-2">
        <BenchZone
          players={benchPlayers}
          allPlayers={allPlayers}
        />
      </div>

      {/* ── Collapsible position legend ────────────────────────── */}
      <details className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
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
