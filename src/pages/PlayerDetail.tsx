import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Check, X, MapPin, Calendar } from 'lucide-react'
import { usePlayerStore } from '../store/playerStore'
import { useMatchStore } from '../store/matchStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import PositionBadge from '../components/players/PositionBadge'
import { POSITION_LABELS, type Position } from '../types'
import { fmtSlashWithTime } from '../utils/dateFormat'

/** Maps each Position to a { row, col } on a 4-row × 3-col pitch grid.
 *  row 1 = attack (top), row 4 = goalkeeper (bottom).
 *  col 1 = left,  col 2 = center,  col 3 = right.
 */
type Zone = { row: number; col: number }
const POSITION_ZONE: Record<Position, Zone | null> = {
  MV:  { row: 4, col: 2 },
  VB:  { row: 3, col: 1 },
  CB:  { row: 3, col: 2 },
  HB:  { row: 3, col: 3 },
  VCB: { row: 3, col: 1 },
  HCB: { row: 3, col: 3 },
  VM:  { row: 2, col: 1 },
  CM:  { row: 2, col: 2 },
  HM:  { row: 2, col: 3 },
  VCM: { row: 2, col: 1 },
  HCM: { row: 2, col: 3 },
  CMD: { row: 2, col: 2 },
  VA:  { row: 1, col: 1 },
  A:   { row: 1, col: 2 },
  HA:  { row: 1, col: 3 },
  SS:  { row: 1, col: 2 },
  UKE: null,
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const player = usePlayerStore((s) => s.players.find((p) => p.id === id))
  const updatePlayer = usePlayerStore((s) => s.updatePlayer)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)
  const matches        = useMatchStore((s) => s.matches)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(player?.name ?? '')
  const [position, setPosition] = useState<Position>(player?.position ?? 'UKE')
  const [number, setNumber] = useState(player?.number?.toString() ?? '')

  if (!player) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
          <ArrowLeft size={18} /> Tilbage
        </button>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Spiller ikke fundet</p>
      </div>
    )
  }

  const stats = getPlayerStats(player.id)

  const upcomingRegistered = matches
    .filter((m) => !m.isCompleted && m.attendance.includes(player.id))
    .sort((a, b) => a.date.localeCompare(b.date))

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

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="px-4 pt-5 pb-6">
      {/* Back */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 font-medium text-sm active:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          <ArrowLeft size={18} /> Spillere
        </button>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl active:scale-95 transition-transform"
            style={{ background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <Edit2 size={15} /> Rediger
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="p-2 rounded-xl active:scale-95 transition-transform"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
            >
              <X size={18} />
            </button>
            <button
              onClick={save}
              className="p-2 rounded-xl active:scale-95 transition-transform"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
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
            className="text-xl font-bold rounded-xl px-3 py-2 text-center w-full max-w-xs focus:outline-none"
            style={inputStyle}
          />
        ) : (
          <h2 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            {player.name}
          </h2>
        )}
        {!editing && (
          <div className="mt-2">
            <PositionBadge position={player.position} />
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div
          className="rounded-2xl p-4 mb-6 space-y-4"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          <div>
            <label className="text-xs uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'var(--text-secondary)' }}>
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="w-full rounded-xl px-3 py-3 focus:outline-none"
              style={inputStyle}
            >
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider mb-1.5 block"
                   style={{ color: 'var(--text-secondary)' }}>
              Trøjenummer (valgfri)
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="f.eks. 9"
              className="w-full rounded-xl px-3 py-3 focus:outline-none placeholder-slate-400"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Kampe"       value={stats.matchesPlayed} color="var(--text-primary)" />
        <StatCard label="Mål"         value={stats.goals}         color="#4ade80" />
        <StatCard label="Assists"     value={stats.assists}       color="#60a5fa" />
        {player.position === 'MV' && (
          <StatCard label="Clean sheets" value={stats.cleanSheets} color="#c084fc" />
        )}
        {stats.yellowCards > 0 && (
          <StatCard label="🟡 Gule kort"  value={stats.yellowCards} color="#facc15" />
        )}
        {stats.redCards > 0 && (
          <StatCard label="🔴 Røde kort"  value={stats.redCards}    color="#f87171" />
        )}
      </div>

      {/* Zero-stats hint */}
      {stats.matchesPlayed === 0 && (
        <p className="text-xs text-center italic mb-4" style={{ color: 'var(--text-faint)' }}>
          Ingen kampstatistik endnu
        </p>
      )}

      {/* Position card */}
      {player.position !== 'UKE' && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-4"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          <PositionMiniPitch position={player.position} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1"
               style={{ color: 'var(--text-muted)' }}>
              Position
            </p>
            <p className="font-semibold text-base leading-snug"
               style={{ color: 'var(--text-primary)' }}>
              {POSITION_LABELS[player.position]}
            </p>
            <p className="text-xs mt-0.5 font-mono"
               style={{ color: 'var(--text-faint)' }}>
              {player.position}
            </p>
          </div>
        </div>
      )}

      {/* Upcoming registrations */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
             style={{ color: 'var(--text-muted)' }}>
            Kommende kampe
          </p>
        </div>

        {upcomingRegistered.length === 0 ? (
          <p className="text-xs italic px-1" style={{ color: 'var(--text-faint)' }}>
            Ikke tilmeldt nogen kommende kampe
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingRegistered.map((m) => (
              <div
                key={m.id}
                className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    vs. {m.opponent}
                  </p>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    <MapPin size={9} className="shrink-0" />
                    {m.location}
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--icon-accent-bg)',
                    color: 'var(--accent)',
                    border: '1px solid var(--badge-accent-border)',
                  }}
                >
                  {fmtSlashWithTime(m.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-display text-4xl leading-none" style={{ color }}>{value}</p>
    </div>
  )
}

/** Mini pitch SVG (80×108 px) with a glowing dot at the player's position zone. */
function PositionMiniPitch({ position }: { position: Position }) {
  const zone = POSITION_ZONE[position]
  const W = 80, H = 108
  const ROWS = 4, COLS = 3
  const cw = W / COLS      // cell width  ≈ 26.67
  const rh = H / ROWS      // cell height = 27

  const dotX = zone ? (zone.col - 1) * cw + cw / 2 : null
  const dotY = zone ? (zone.row - 1) * rh + rh / 2 : null

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ borderRadius: 10, flexShrink: 0, display: 'block' }}
    >
      <defs>
        <radialGradient id="pdGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#E53E3E" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E53E3E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pdDot" cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="white"   stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E53E3E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Pitch background */}
      <rect width={W} height={H} rx="10" fill="#173a22" />

      {/* Alternating stripe rows */}
      {Array.from({ length: ROWS }, (_, i) => (
        <rect key={i} x="0" y={i * rh} width={W} height={rh}
              fill="white" fillOpacity={i % 2 === 0 ? 0.035 : 0} />
      ))}

      {/* Outer border */}
      <rect x="2.5" y="2.5" width={W - 5} height={H - 5} rx="8.5"
            fill="none" stroke="white" strokeOpacity="0.20" strokeWidth="0.75" />

      {/* Halfway line */}
      <line x1="4" y1={H / 2} x2={W - 4} y2={H / 2}
            stroke="white" strokeOpacity="0.15" strokeWidth="0.75" />

      {/* Centre circle */}
      <circle cx={W / 2} cy={H / 2} r="9"
              fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="0.75" />

      {/* Top goal area */}
      <rect x={(W - 26) / 2} y="2.5" width="26" height="9" rx="1.5"
            fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="0.75" />

      {/* Bottom goal area */}
      <rect x={(W - 26) / 2} y={H - 11.5} width="26" height="9" rx="1.5"
            fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="0.75" />

      {/* Zone highlight + player dot */}
      {zone && dotX !== null && dotY !== null && (
        <>
          {/* Highlight cell */}
          <rect
            x={(zone.col - 1) * cw + 2}
            y={(zone.row - 1) * rh + 2}
            width={cw - 4}
            height={rh - 4}
            rx="5"
            fill="rgba(229,62,62,0.10)"
          />
          {/* Soft glow */}
          <circle cx={dotX} cy={dotY} r="11" fill="url(#pdGlow)" />
          {/* Dot */}
          <circle cx={dotX} cy={dotY} r="5.5"
                  fill="#E53E3E"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(229,62,62,0.7))' }} />
          <circle cx={dotX} cy={dotY} r="5.5" fill="url(#pdDot)" />
        </>
      )}
    </svg>
  )
}
