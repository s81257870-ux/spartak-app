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
type GoalTeam = 'us' | 'them'

interface EventFormData {
  type: EventType
  team: GoalTeam
  scorerId: string
  assistId: string
}

const emptyForm = (type: EventType = 'goal', team: GoalTeam = 'us'): EventFormData => ({
  type, team, scorerId: '', assistId: '',
})

const EVENT_CONFIG: Record<EventType, {
  label: string; emoji: string; color: string
  bgColor: string; borderColor: string; btnColor: string
}> = {
  'goal':        { label: 'Mål',       emoji: '⚽', color: 'text-green-400',  bgColor: 'bg-green-900/50',  borderColor: 'border-green-500/30',  btnColor: 'bg-green-500' },
  'yellow-card': { label: 'Gult kort', emoji: '🟡', color: 'text-yellow-400', bgColor: 'bg-yellow-900/40', borderColor: 'border-yellow-500/30', btnColor: 'bg-yellow-400' },
  'red-card':    { label: 'Rødt kort', emoji: '🔴', color: 'text-red-400',    bgColor: 'bg-red-900/40',    borderColor: 'border-red-500/30',    btnColor: 'bg-red-500' },
}

export default function EventsTab({ matchId }: Props) {
  const match       = useMatchStore((s) => s.matches.find((m) => m.id === matchId))
  const addEvent    = useMatchStore((s) => s.addEvent)
  const updateEvent = useMatchStore((s) => s.updateEvent)
  const deleteEvent = useMatchStore((s) => s.deleteEvent)
  const players     = usePlayerStore((s) => s.players)
  const isAdmin     = useAuthStore((s) => s.isAdmin)

  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState<EventFormData>(emptyForm())
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [editForm,   setEditForm]   = useState<EventFormData>(emptyForm())

  if (!match) return null

  const openForm = (type: EventType, team: GoalTeam = 'us') => {
    setForm(emptyForm(type, team))
    setShowForm(true)
  }

  const submit = () => {
    if (form.type !== 'goal' && !form.scorerId) return
    if (form.type === 'goal' && form.team === 'us' && !form.scorerId) return
    addEvent(matchId, {
      type: form.type,
      scorerId: form.scorerId,
      assistId: form.type === 'goal' && form.team === 'us' ? form.assistId || undefined : undefined,
      team: form.team,
    })
    setForm(emptyForm())
    setShowForm(false)
  }

  const startEdit = (event: MatchEvent) => {
    setEditingId(event.id)
    setEditForm({ type: event.type, team: event.team ?? 'us', scorerId: event.scorerId, assistId: event.assistId ?? '' })
  }

  const saveEdit = () => {
    if (!editingId) return
    if (editForm.type !== 'goal' && !editForm.scorerId) return
    if (editForm.type === 'goal' && editForm.team === 'us' && !editForm.scorerId) return
    updateEvent(matchId, editingId, {
      type: editForm.type,
      scorerId: editForm.scorerId,
      assistId: editForm.type === 'goal' && editForm.team === 'us' ? editForm.assistId || undefined : undefined,
      team: editForm.team,
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
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => openForm('goal', 'us')}
            className="flex flex-col items-center justify-center gap-1 bg-green-900/50 border border-green-500/30 text-green-400 rounded-xl py-3 font-medium text-xs active:scale-[0.97] transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>⚽ Mål</span>
          </button>
          <button
            onClick={() => openForm('goal', 'them')}
            className="flex flex-col items-center justify-center gap-1 bg-red-900/30 border border-red-500/20 text-red-400 rounded-xl py-3 font-medium text-xs active:scale-[0.97] transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>⚽ Modstandermål</span>
          </button>
          <button
            onClick={() => openForm('yellow-card')}
            className="flex flex-col items-center justify-center gap-1 bg-yellow-900/40 border border-yellow-500/30 text-yellow-400 rounded-xl py-3 font-medium text-xs active:scale-[0.97] transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>🟡 Gult kort</span>
          </button>
          <button
            onClick={() => openForm('red-card')}
            className="flex flex-col items-center justify-center gap-1 bg-red-900/40 border border-red-500/30 text-red-400 rounded-xl py-3 font-medium text-xs active:scale-[0.97] transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>🔴 Rødt kort</span>
          </button>
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
          submitLabel={form.type === 'goal' && form.team === 'them' ? 'Gem modstandermål' : `Gem ${EVENT_CONFIG[form.type].label.toLowerCase()}`}
        />
      )}

      {/* Events list */}
      {match.events.length === 0 && !showForm ? (
        <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
          <Goal size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ingen begivenheder registreret</p>
        </div>
      ) : (
        <div className="space-y-2">
          {match.events.map((event) => {
            const cfg = EVENT_CONFIG[event.type]
            const isOpponentGoal = event.type === 'goal' && event.team === 'them'
            return (
              <div
                key={event.id}
                className="rounded-2xl p-4"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
              >
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
                    <div className={`w-10 h-10 ${isOpponentGoal ? 'bg-red-900/40' : cfg.bgColor} rounded-full flex items-center justify-center shrink-0`}>
                      <span className="text-lg leading-none">{cfg.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isOpponentGoal ? 'text-red-400' : cfg.color}`}>
                        {isOpponentGoal ? 'Modstandermål' : cfg.label}
                      </p>
                      {!isOpponentGoal && (
                        <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {getPlayerName(event.scorerId)}
                        </p>
                      )}
                      {event.type === 'goal' && !isOpponentGoal && event.assistId && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Assist: {getPlayerName(event.assistId)}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(event)}
                          className="p-1 active:text-slate-300"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteEvent(matchId, event.id)}
                          className="p-1 active:text-red-400"
                          style={{ color: 'var(--text-muted)' }}
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
  const isOpponentGoal = isGoal && form.team === 'them'

  const selectStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-primary)',
  }

  return (
    <div
      className="rounded-2xl p-4 mb-4 space-y-3"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
    >
      {/* Type + team selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange({ ...form, type: 'goal', team: 'us', assistId: '' })}
          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
            isGoal && form.team === 'us'
              ? 'bg-green-900/50 text-green-400 border border-green-500/30'
              : 'border border-transparent'
          }`}
          style={!(isGoal && form.team === 'us') ? { background: 'var(--bg-input)', color: 'var(--text-muted)' } : {}}
        >
          ⚽ Mål
        </button>
        <button
          onClick={() => onChange({ ...form, type: 'goal', team: 'them', scorerId: '', assistId: '' })}
          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
            isOpponentGoal
              ? 'bg-red-900/30 text-red-400 border border-red-500/20'
              : 'border border-transparent'
          }`}
          style={!isOpponentGoal ? { background: 'var(--bg-input)', color: 'var(--text-muted)' } : {}}
        >
          ⚽ Modstandermål
        </button>
        <button
          onClick={() => onChange({ ...form, type: 'yellow-card', team: 'us', assistId: '' })}
          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
            form.type === 'yellow-card'
              ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30'
              : 'border border-transparent'
          }`}
          style={form.type !== 'yellow-card' ? { background: 'var(--bg-input)', color: 'var(--text-muted)' } : {}}
        >
          🟡 Gult kort
        </button>
        <button
          onClick={() => onChange({ ...form, type: 'red-card', team: 'us', assistId: '' })}
          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
            form.type === 'red-card'
              ? 'bg-red-900/40 text-red-400 border border-red-500/30'
              : 'border border-transparent'
          }`}
          style={form.type !== 'red-card' ? { background: 'var(--bg-input)', color: 'var(--text-muted)' } : {}}
        >
          🔴 Rødt kort
        </button>
      </div>

      {/* Player select — hidden for opponent goals */}
      {!isOpponentGoal && (
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
            {isGoal ? 'Målscorer *' : 'Spiller *'}
          </label>
          <select
            value={form.scorerId}
            onChange={(e) => onChange({ ...form, scorerId: e.target.value })}
            className="w-full rounded-xl px-3 py-3 focus:outline-none"
            style={selectStyle}
          >
            <option value="">Vælg spiller...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{displayName(p, players)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Assist — only for our goals */}
      {isGoal && !isOpponentGoal && (
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
            Assist (valgfri)
          </label>
          <select
            value={form.assistId}
            onChange={(e) => onChange({ ...form, assistId: e.target.value })}
            className="w-full rounded-xl px-3 py-3 focus:outline-none"
            style={selectStyle}
          >
            <option value="">Ingen assist</option>
            {players.filter((p) => p.id !== form.scorerId).map((p) => (
              <option key={p.id} value={p.id}>{displayName(p, players)}</option>
            ))}
          </select>
        </div>
      )}

      {isOpponentGoal && (
        <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
          Modstandermålet registreres uden målscorer.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-medium active:scale-[0.98] text-sm"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          Annuller
        </button>
        <button
          onClick={onSubmit}
          disabled={!isOpponentGoal && !form.scorerId}
          className={`flex-1 ${isOpponentGoal ? 'bg-red-500' : cfg.btnColor} disabled:opacity-30 text-black font-bold py-3 rounded-xl text-sm active:scale-[0.98]`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
