import { useState } from 'react'
import { Pencil, Trash2, Goal } from 'lucide-react'
import { useMatchStore } from '../../store/matchStore'
import { usePlayerStore } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import type { MatchEvent, Player } from '../../types'
import { displayName } from '../../utils/playerName'

/** Football card rectangle — proportional to a real card (3:4 ratio). */
function CardIcon({ color }: { color: string }) {
  return (
    <div
      className="rounded-[2px] shrink-0"
      style={{ width: 11, height: 15, background: color }}
    />
  )
}

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
  label: string
  color: string          // text / icon colour (hex)
  nodeBg: string         // timeline node background
  nodeBorder: string     // timeline node border
  activeBg: string       // form selector active background
  activeBorder: string   // form selector active border
  btnBg: string          // submit button background
}> = {
  'goal': {
    label: 'Mål',
    color: '#4ade80',
    nodeBg: 'rgba(74,222,128,0.10)',
    nodeBorder: 'rgba(74,222,128,0.22)',
    activeBg: 'rgba(74,222,128,0.12)',
    activeBorder: 'rgba(74,222,128,0.30)',
    btnBg: '#22c55e',
  },
  'yellow-card': {
    label: 'Gult kort',
    color: '#facc15',
    nodeBg: 'rgba(250,204,21,0.12)',
    nodeBorder: 'rgba(250,204,21,0.25)',
    activeBg: 'rgba(250,204,21,0.12)',
    activeBorder: 'rgba(250,204,21,0.30)',
    btnBg: '#ca8a04',
  },
  'red-card': {
    label: 'Rødt kort',
    color: '#f87171',
    nodeBg: 'rgba(248,113,113,0.12)',
    nodeBorder: 'rgba(248,113,113,0.22)',
    activeBg: 'rgba(248,113,113,0.10)',
    activeBorder: 'rgba(248,113,113,0.28)',
    btnBg: '#ef4444',
  },
}

/** Returns the correct node icon for an event. */
function EventIcon({ type, isOpponentGoal }: { type: EventType; isOpponentGoal: boolean }) {
  if (type === 'yellow-card') return <CardIcon color="#facc15" />
  if (type === 'red-card')    return <CardIcon color="#f87171" />
  // goal — use lucide Goal icon, colour reflects our goal vs opponent goal
  return <Goal size={16} color={isOpponentGoal ? '#f87171' : '#4ade80'} />
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
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-xs active:scale-[0.97] transition-transform"
            style={{
              background: EVENT_CONFIG['goal'].activeBg,
              border: `1px solid ${EVENT_CONFIG['goal'].activeBorder}`,
              color: EVENT_CONFIG['goal'].color,
            }}
          >
            <Goal size={14} />
            <span>Mål</span>
          </button>
          <button
            onClick={() => openForm('goal', 'them')}
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-xs active:scale-[0.97] transition-transform"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.18)',
              color: '#f87171',
            }}
          >
            <Goal size={14} />
            <span>Modstandermål</span>
          </button>
          <button
            onClick={() => openForm('yellow-card')}
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-xs active:scale-[0.97] transition-transform"
            style={{
              background: EVENT_CONFIG['yellow-card'].activeBg,
              border: `1px solid ${EVENT_CONFIG['yellow-card'].activeBorder}`,
              color: EVENT_CONFIG['yellow-card'].color,
            }}
          >
            <CardIcon color="#facc15" />
            <span>Gult kort</span>
          </button>
          <button
            onClick={() => openForm('red-card')}
            className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-xs active:scale-[0.97] transition-transform"
            style={{
              background: EVENT_CONFIG['red-card'].activeBg,
              border: `1px solid ${EVENT_CONFIG['red-card'].activeBorder}`,
              color: EVENT_CONFIG['red-card'].color,
            }}
          >
            <CardIcon color="#f87171" />
            <span>Rødt kort</span>
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

      {/* Timeline / events list */}
      {match.events.length === 0 && !showForm ? (
        <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
          <Goal size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ingen begivenheder registreret</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical spine — only rendered when 2+ events */}
          {match.events.length > 1 && (
            <div
              className="absolute top-5 bottom-5 w-px pointer-events-none"
              style={{ left: 19, background: 'var(--border)' }}
            />
          )}

          <div className="space-y-3">
            {match.events.map((event) => {
              const cfg = EVENT_CONFIG[event.type]
              const isOpponentGoal = event.type === 'goal' && event.team === 'them'

              const effectiveCfg = isOpponentGoal
                ? { ...EVENT_CONFIG['goal'], color: '#f87171', nodeBg: 'rgba(248,113,113,0.12)', nodeBorder: 'rgba(248,113,113,0.22)' }
                : EVENT_CONFIG[event.type]

              return (
                <div key={event.id} className="flex gap-3 items-start relative">
                  {/* Timeline node */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                    style={{
                      background: effectiveCfg.nodeBg,
                      border: `1.5px solid ${effectiveCfg.nodeBorder}`,
                    }}
                  >
                    <EventIcon type={event.type} isOpponentGoal={isOpponentGoal} />
                  </div>

                  {/* Content card */}
                  <div
                    className="flex-1 min-w-0 rounded-2xl px-3 py-2.5"
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
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm leading-snug"
                            style={{ color: effectiveCfg.color }}
                          >
                            {isOpponentGoal ? 'Modstandermål' : cfg.label}
                          </p>
                          {!isOpponentGoal && (
                            <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                              {getPlayerName(event.scorerId)}
                            </p>
                          )}
                          {event.type === 'goal' && !isOpponentGoal && event.assistId && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              Assist: {getPlayerName(event.assistId)}
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(event)}
                              className="p-1.5 rounded-lg active:bg-white/5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteEvent(matchId, event.id)}
                              className="p-1.5 rounded-lg active:bg-red-500/10"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
        {/* Our goal */}
        <button
          onClick={() => onChange({ ...form, type: 'goal', team: 'us', assistId: '' })}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            isGoal && form.team === 'us'
              ? { background: EVENT_CONFIG['goal'].activeBg, color: EVENT_CONFIG['goal'].color, border: `1px solid ${EVENT_CONFIG['goal'].activeBorder}` }
              : { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid transparent' }
          }
        >
          <Goal size={12} />
          Mål
        </button>

        {/* Opponent goal */}
        <button
          onClick={() => onChange({ ...form, type: 'goal', team: 'them', scorerId: '', assistId: '' })}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            isOpponentGoal
              ? { background: 'rgba(248,113,113,0.10)', color: '#f87171', border: '1px solid rgba(248,113,113,0.28)' }
              : { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid transparent' }
          }
        >
          <Goal size={12} />
          Modstandermål
        </button>

        {/* Yellow card */}
        <button
          onClick={() => onChange({ ...form, type: 'yellow-card', team: 'us', assistId: '' })}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            form.type === 'yellow-card'
              ? { background: EVENT_CONFIG['yellow-card'].activeBg, color: EVENT_CONFIG['yellow-card'].color, border: `1px solid ${EVENT_CONFIG['yellow-card'].activeBorder}` }
              : { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid transparent' }
          }
        >
          <CardIcon color={form.type === 'yellow-card' ? '#facc15' : 'var(--text-muted)'} />
          Gult kort
        </button>

        {/* Red card */}
        <button
          onClick={() => onChange({ ...form, type: 'red-card', team: 'us', assistId: '' })}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={
            form.type === 'red-card'
              ? { background: EVENT_CONFIG['red-card'].activeBg, color: EVENT_CONFIG['red-card'].color, border: `1px solid ${EVENT_CONFIG['red-card'].activeBorder}` }
              : { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid transparent' }
          }
        >
          <CardIcon color={form.type === 'red-card' ? '#f87171' : 'var(--text-muted)'} />
          Rødt kort
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
          className="flex-1 disabled:opacity-30 font-bold py-3 rounded-xl text-sm active:scale-[0.98]"
          style={{
            background: isOpponentGoal ? '#ef4444' : cfg.btnBg,
            color: '#000',
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
