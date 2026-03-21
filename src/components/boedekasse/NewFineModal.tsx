import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useFineStore } from '../../store/fineStore'
import { usePlayerStore } from '../../store/playerStore'
import { useMatchStore } from '../../store/matchStore'
import { FINE_TYPES, CATEGORY_LABELS, type FineType } from '../../data/fineTypes'

interface Props {
  onClose: () => void
}

const today = () => new Date().toISOString().split('T')[0]

const CATEGORIES: FineType['category'][] = ['kamp', 'glemte', 'special']

export default function NewFineModal({ onClose }: Props) {
  const players   = usePlayerStore((s) => s.players)
  const matches   = useMatchStore((s) => s.matches)
  const addFine   = useFineStore((s) => s.addFine)
  const addFines  = useFineStore((s) => s.addFines)

  const [playerId,    setPlayerId]    = useState('')
  const [fineTypeId,  setFineTypeId]  = useState('')
  const [note,        setNote]        = useState('')
  const [matchId,     setMatchId]     = useState('')
  const [date,        setDate]        = useState(today())
  const [goals,       setGoals]       = useState(1)

  const selectedType  = FINE_TYPES.find((t) => t.id === fineTypeId)
  const isPrMaal      = fineTypeId === 'pr-maal'
  const selectedMatch = matches.find((m) => m.id === matchId)

  // For pr-maal: how many players will be charged
  const prMaalPlayers = isPrMaal && selectedMatch
    ? players.filter((p) => selectedMatch.attendance.includes(p.id))
    : []

  const canSubmit = isPrMaal
    ? matchId !== '' && goals > 0
    : playerId !== '' && fineTypeId !== ''

  function handleSubmit() {
    if (!canSubmit) return

    if (isPrMaal && selectedMatch) {
      // One fine per signed-up player: amount = goals × 5 kr per player
      const amount = goals * 5
      addFines(
        prMaalPlayers.map((p) => ({
          playerId:   p.id,
          fineTypeId: 'pr-maal',
          label:      `Pr. mål der går ind (${goals} mål)`,
          amount,
          date,
          note:       note || undefined,
          paid:       false,
          matchId:    selectedMatch.id,
        }))
      )
    } else if (selectedType) {
      addFine({
        playerId,
        fineTypeId,
        label:   selectedType.label,
        amount:  selectedType.amount,
        date,
        note:    note || undefined,
        paid:    false,
        matchId: matchId || undefined,
      })
    }

    onClose()
  }

  // ── Styles shared between selects / inputs ─────────────────────────
  const inputStyle: React.CSSProperties = {
    background:  'var(--bg-input)',
    border:      '1px solid var(--border)',
    color:       'var(--text-primary)',
    borderRadius: '0.75rem',
    padding:     '0.625rem 0.875rem',
    fontSize:    '0.875rem',
    width:       '100%',
    outline:     'none',
    appearance:  'none',
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet */}
      <div
        className="w-full max-w-lg rounded-t-3xl pb-safe overflow-y-auto"
        style={{
          background:   'var(--bg-card)',
          borderTop:    '1px solid var(--border)',
          maxHeight:    '90dvh',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Ny bøde
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
            style={{ background: 'var(--bg-raised)' }}
          >
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="px-5 space-y-4 pb-2">

          {/* ── Fine type ───────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Bødetype
            </label>
            <div className="relative">
              <select
                value={fineTypeId}
                onChange={(e) => { setFineTypeId(e.target.value); setPlayerId('') }}
                style={inputStyle}
              >
                <option value="">Vælg bødetype…</option>
                {CATEGORIES.map((cat) => {
                  const types = FINE_TYPES.filter((t) => t.category === cat)
                  return (
                    <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}{t.category !== 'special' ? ` — ${t.amount} kr` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* ── Player (hidden for pr-maal — applies to all attendance) */}
          {!isPrMaal && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Spiller
              </label>
              <div className="relative">
                <select
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Vælg spiller…</option>
                  {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          )}

          {/* ── Match (required for pr-maal, optional otherwise) ────── */}
          {(isPrMaal || fineTypeId) && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {isPrMaal ? 'Kamp (påkrævet)' : 'Tilknyt kamp (valgfri)'}
              </label>
              <div className="relative">
                <select
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Ingen kamp valgt</option>
                  {[...matches]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        Spartak vs. {m.opponent} ({m.date.split('T')[0]})
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>
          )}

          {/* ── Goals input (pr-maal only) ───────────────────────────── */}
          {isPrMaal && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Antal mål der gik ind
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={goals}
                onChange={(e) => setGoals(Math.max(1, Number(e.target.value)))}
                style={inputStyle}
              />
              {selectedMatch && prMaalPlayers.length > 0 && (
                <p className="mt-2 text-xs rounded-xl px-3 py-2" style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-raised)',
                }}>
                  {goals} mål × 5 kr = <strong style={{ color: 'var(--text-primary)' }}>{goals * 5} kr</strong> per spiller
                  &nbsp;·&nbsp;
                  {prMaalPlayers.length} tilmeldte
                  &nbsp;=&nbsp;
                  <strong style={{ color: '#f97316' }}>{goals * 5 * prMaalPlayers.length} kr total</strong>
                </p>
              )}
            </div>
          )}

          {/* ── Amount preview (non-special) ────────────────────────── */}
          {selectedType && !isPrMaal && (
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Beløb</span>
              <span className="text-xl font-black" style={{ color: '#f97316' }}>
                {selectedType.amount} kr
              </span>
            </div>
          )}

          {/* ── Date ────────────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Dato
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* ── Note ────────────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Note (valgfri)
            </label>
            <input
              type="text"
              placeholder="Tilføj en note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* ── Submit ──────────────────────────────────────────────── */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)'
                : 'var(--bg-raised)',
              color:      canSubmit ? '#000' : 'var(--text-faint)',
              boxShadow:  canSubmit ? '0 4px 16px rgba(249,115,22,0.28)' : 'none',
              cursor:     canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {isPrMaal && prMaalPlayers.length > 0
              ? `Opret ${prMaalPlayers.length} bøder`
              : 'Gem bøde'}
          </button>
        </div>
      </div>
    </div>
  )
}
