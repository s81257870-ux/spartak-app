import { useState } from 'react'
import { Plus, Pencil, Trash2, Goal } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import type { MatchEvent, Player } from '../../types'
import { displayName } from '../../utils/playerName'

interface Props {
  matchId: string
}

type EventType = 'goal' | 'yellow-card' | 'red-card'

interface EventFormData {
  type: EventType
  scorerId: string
  assistId: string
}

const emptyForm = (type: EventType = 'goal'): EventFormData => ({
  type,
  scorerId: '',
  assistId: '',
})

const EVENT_CONFIG: Record<EventType, { label: string; emoji: string; color: string; bgColor: string; borderColor: string; btnColor: string }> = {
  'goal':        { label: 'Mål',       emoji: '⚽', color: 'text-green-400',  bgColor: 'bg-green-900/50',  borderColor: 'border-green-500/30',  btnColor: 'bg-green-500' },
  'yellow-card': { label: 'Gult kort', emoji: '🟡', color: 'text-yellow-400', bgColor: 'bg-yellow-900/40', borderColor: 'border-yellow-500/30', btnColor: 'bg-yellow-400' },
  'red-card':    { label: 'Rødt kort', emoji: '🔴', color: 'text-red-400',    bgColor: 'bg-red-900/40',    borderColor: 'border-red-500/30',    btnColor: 'bg-red-500' },
}

export default function EventsTab({ matchId }: Props) {
  const match = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const addEvent = useMatchStore((s) => s.addEvent)
  const updateEvent = useMatchStore((s) => s.updateEvent)
  const deleteEvent = useMatchStore((s) => s.deleteEvent)
  const players = usePlayerStore((s) => s.players)

  const isAdmin = useAuthStore((s) => s.isAdmin)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<EventFormData>(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EventFormData>(emptyForm())

  if (!match) return null

  const openForm = (type: EventType) => {
    setForm(emptyForm(type))
    setShowForm(true)
  }

  const submit = () => {
    if (!form.scorerId) return
    addEvent(matchId, {
      type: form.type,
      scorerId: form.scorerId,
      assistId: form.type === 'goal' ? form.assistId || undefined : undefined,
    })
    setForm(emptyForm())
    setShowForm(false)
  }

  const startEdit = (event: MatchEvent) => {
    setEditingId(event.id)
    setEditForm({
      type: event.type,
      scorerId: event.scorerId,
      assistId: event.assistId ?? '',
    })
  }

  const saveEdit = () => {
    if (!editingId || !editForm.scorerId) return
    updateEvent(matchId, editingId, {
      type: editForm.type,
      scorerId: editForm.scorerId,
      assistId: editForm.type === 'goal' ? editForm.assistId || undefined : undefined,
    })
    setEditingId(null)
  }

  const getPlayerName = (id: string) => {
    const p = players.find((pl) => pl.id === id)
    return p ? displayName(p, players) : 'Ukendt'
  }

  return (
    <div>
      {/* Add event buttons — admin only */}
      {isAdmin && !showForm && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
            <button
              key={type}
              onClick={() => openForm(type)}
              className={`flex flex-col items-center justify-center gap-1 ${cfg.bgColor} border ${cfg.borderColor} ${cfg.color} rounded-xl py-3 font-medium text-xs active:scale-[0.97] transition-transform`}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>{cfg.emoji} {cfg.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add form — admin only */}
      {isAdmin && showForm && (
        <EventForm
          form={form}
          players={players}
          onChange={(f) => setForm(f)}
          onSubmit={submit}
          onCancel={() => { setShowForm(false); setForm(emptyForm()) }}
          submitLabel={`Gem ${EVENT_CONFIG[form.type].label.toLowerCase()}`}
        />
      )}

      {/* Events list */}
      {match.events.length === 0 && !showForm ? (
        <div className="text-center py-10 text-slate-500">
          <Goal size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ingen begivenheder registreret</p>
        </div>
      ) : (
        <div className="space-y-2">
          {match.events.map((event) => {
            const cfg = EVENT_CONFIG[event.type]
            return (
              <div key={event.id} className="bg-[#1a1d27] rounded-2xl p-4">
                {editingId === event.id ? (
                  <EventForm
                    form={editForm}
                    players={players}
                    onChange={(f) => setEditForm(f)}
                    onSubmit={saveEdit}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Gem"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${cfg.bgColor} rounded-full flex items-center justify-center shrink-0`}>
                      <span className="text-lg leading-none">{cfg.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${cfg.color}`}>
                        {cfg.label}
                      </p>
                      <p className="text-white text-sm truncate">
                        {getPlayerName(event.scorerId)}
                      </p>
                      {event.type === 'goal' && event.assistId && (
                        <p className="text-slate-400 text-xs">
                          Assist: {getPlayerName(event.assistId)}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(event)}
                          className="text-slate-500 active:text-slate-300 p-1"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteEvent(matchId, event.id)}
                          className="text-slate-500 active:text-red-400 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface FormProps {
  form: EventFormData
  players: Player[]
  onChange: (f: EventFormData) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}

function EventForm({ form, players, onChange, onSubmit, onCancel, submitLabel }: FormProps) {
  const cfg = EVENT_CONFIG[form.type]
  const isGoal = form.type === 'goal'
  const playerLabel = isGoal ? 'Målscorer *' : 'Spiller *'

  return (
    <div className="bg-[#1a1d27] rounded-2xl p-4 mb-4 space-y-3">
      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, c]) => (
          <button
            key={type}
            onClick={() => onChange({ ...form, type, assistId: '' })}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              form.type === type
                ? `${c.bgColor} ${c.color} border ${c.borderColor}`
                : 'bg-white/5 text-slate-500 border border-transparent'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Player select */}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">{playerLabel}</label>
        <select
          value={form.scorerId}
          onChange={(e) => onChange({ ...form, scorerId: e.target.value })}
          className="w-full bg-[#0f1117] border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-orange-500/50"
        >
          <option value="">Vælg spiller...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{displayName(p, players)}</option>
          ))}
        </select>
      </div>

      {/* Assist (goals only) */}
      {isGoal && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Assist (valgfri)</label>
          <select
            value={form.assistId}
            onChange={(e) => onChange({ ...form, assistId: e.target.value })}
            className="w-full bg-[#0f1117] border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-orange-500/50"
          >
            <option value="">Ingen assist</option>
            {players.filter((p) => p.id !== form.scorerId).map((p) => (
              <option key={p.id} value={p.id}>{displayName(p, players)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-medium active:scale-[0.98] text-sm"
        >
          Annuller
        </button>
        <button
          onClick={onSubmit}
          disabled={!form.scorerId}
          className={`flex-1 ${cfg.btnColor} disabled:opacity-30 text-black font-bold py-3 rounded-xl text-sm active:scale-[0.98]`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
