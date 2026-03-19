import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Check, X } from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import { useMatchStore } from '../store/matchStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import PositionBadge from '../components/players/PositionBadge'
import { POSITION_LABELS, type Position } from '../types'

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.players.find((p) => p.id === id))
  const updatePlayer = usePlayerStore((s) => s.updatePlayer)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(player?.name ?? '')
  const [position, setPosition] = useState<Position>(player?.position ?? 'UKE')
  const [number, setNumber] = useState(player?.number?.toString() ?? '')

  if (!player) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="text-green-400 mb-4 flex items-center gap-1">
          <ArrowLeft size={18} /> Tilbage
        </button>
        <p className="text-slate-400">Spiller ikke fundet</p>
      </div>
    )
  }

  const stats = getPlayerStats(player.id)

  const save = () => {
    updatePlayer(player.id, {
      name: name.trim() || player.name,
      position,
      number: number ? parseInt(number) : undefined,
    })
    setEditing(false)
  }

  const cancel = () => {
    setName(player.name)
    setPosition(player.position)
    setNumber(player.number?.toString() ?? '')
    setEditing(false)
  }

  return (
    <div className="px-4 pt-5 pb-6">
      {/* Back */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-green-400 font-medium text-sm active:opacity-70"
        >
          <ArrowLeft size={18} /> Spillere
        </button>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 bg-[#1a1d27] text-white text-sm px-3 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <Edit2 size={15} /> Rediger
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="bg-[#1a1d27] text-slate-400 p-2 rounded-xl active:scale-95 transition-transform"
            >
              <X size={18} />
            </button>
            <button
              onClick={save}
              className="bg-green-500 text-black p-2 rounded-xl active:scale-95 transition-transform"
            >
              <Check size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center mb-8">
        <PlayerAvatar name={player.name} size="lg" className="mb-3" />
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold text-white bg-[#1a1d27] border border-white/10 rounded-xl px-3 py-2 text-center w-full max-w-xs focus:outline-none focus:border-green-500/50"
          />
        ) : (
          <h2 className="text-xl font-bold text-white text-center">{player.name}</h2>
        )}
        {!editing && (
          <div className="mt-2">
            <PositionBadge position={player.position} />
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-[#1a1d27] rounded-2xl p-4 mb-6 space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="w-full bg-[#0f1117] border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-green-500/50"
            >
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Trøjenummer (valgfri)</label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="f.eks. 9"
              className="w-full bg-[#0f1117] border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-green-500/50"
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Kampe" value={stats.matchesPlayed} color="text-white" />
        <StatCard label="Mål" value={stats.goals} color="text-green-400" />
        <StatCard label="Assists" value={stats.assists} color="text-blue-400" />
        {player.position === 'MV' && (
          <StatCard label="Clean sheets" value={stats.cleanSheets} color="text-purple-400" />
        )}
        {stats.yellowCards > 0 && (
          <StatCard label="🟡 Gule kort" value={stats.yellowCards} color="text-yellow-400" />
        )}
        {stats.redCards > 0 && (
          <StatCard label="🔴 Røde kort" value={stats.redCards} color="text-red-400" />
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#1a1d27] rounded-2xl p-4">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
