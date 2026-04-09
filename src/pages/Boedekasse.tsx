import { useState, useMemo } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, Trophy, History, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFineStore } from '../store/fineStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import NewFineModal from '../components/boedekasse/NewFineModal'
import { FINE_TYPES, CATEGORY_LABELS, type FineType } from '../data/fineTypes'
import { SEASON_LABEL } from '../data/leagueTable'
import PageHeader from '../components/layout/PageHeader'
import { fmtDayMonthYear } from '../utils/dateFormat'

type Tab = 'spillere' | 'historik' | 'regler'

const CATEGORIES: FineType['category'][] = ['kamp', 'glemte', 'special']

// Human-readable suffix per fine type for the rules list
const AMOUNT_SUFFIX: Partial<Record<string, string>> = {
  'stoevler':  ' pr. stk.',
  'stroemper': ' pr. stk.',
  'pr-maal':   ' pr. mand',
}


const RANK_STYLE: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: 'rgba(234,179,8,0.14)', color: '#eab308', border: 'rgba(234,179,8,0.28)' },
  2: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
  3: { bg: 'rgba(180,127,80,0.12)', color: '#b07040', border: 'rgba(180,127,80,0.25)' },
}

function getPersonality(rank: number, total: number, count: number): string | null {
  if (total === 0) return 'Ren samvittighed'
  if (rank === 1) return count >= 5 ? 'Seriel lovbryder' : 'Kassemester'
  if (rank === 2) return 'Vicekassemester'
  if (rank === 3) return 'Syndebuk'
  return null
}

export default function Boedekasse() {
  const fines       = useFineStore((s) => s.fines)
  const togglePaid  = useFineStore((s) => s.togglePaid)
  const deleteFine  = useFineStore((s) => s.deleteFine)
  const players     = usePlayerStore((s) => s.players)
  const isAdmin     = useAuthStore((s) => s.isAdmin)

  const [tab,      setTab]      = useState<Tab>('spillere')
  const [showModal, setShowModal] = useState(false)

  const getPlayer = (id: string) => players.find((p) => p.id === id)

  // ── Derived totals ───────────────────────────────────────────────────
  const totalAll      = fines.reduce((sum, f) => sum + f.amount, 0)
  const unpaidCount   = fines.filter((f) => !f.paid).length

  // Per-player totals — total accumulated (paid + unpaid), unpaid amount separately
  const playerTotals = useMemo(() => {
    const map = new Map<string, { total: number; count: number; unpaid: number; unpaidAmt: number }>()
    for (const f of fines) {
      const existing = map.get(f.playerId) ?? { total: 0, count: 0, unpaid: 0, unpaidAmt: 0 }
      map.set(f.playerId, {
        total:     existing.total     + f.amount,
        count:     existing.count     + 1,
        unpaid:    existing.unpaid    + (f.paid ? 0 : 1),
        unpaidAmt: existing.unpaidAmt + (f.paid ? 0 : f.amount),
      })
    }
    return map
  }, [fines])

  // Player with most total fines
  const topDebtor = useMemo(() => {
    let max = 0
    let pid = ''
    playerTotals.forEach((v, k) => {
      if (v.total > max) { max = v.total; pid = k }
    })
    return pid ? { player: getPlayer(pid), amount: max } : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerTotals])

  // Sorted player list by total accumulated desc
  const sortedPlayers = useMemo(() => {
    return [...playerTotals.entries()]
      .map(([pid, stats]) => ({ player: getPlayer(pid), ...stats, pid }))
      .filter((r) => r.player)
      .sort((a, b) => b.total - a.total)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerTotals])

  // Historik: all fines sorted newest first
  const sortedFines = useMemo(
    () => [...fines].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [fines]
  )

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="pb-8" style={{ minHeight: '100svh' }}>

      {showModal && <NewFineModal onClose={() => setShowModal(false)} />}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-10 pb-5">
        <div className="flex items-end justify-between">
          <div>
            <PageHeader label={SEASON_LABEL} title="Bødekasse" />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
              style={{
                background: 'var(--cta-bg)',
                color: 'var(--cta-color)',
                boxShadow:  '0 4px 16px var(--cta-shadow)',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Ny bøde
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Overview card ───────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4"
             style={{ color: 'var(--text-muted)' }}>
            Overblik
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Total all-time */}
            <div className="text-center">
              <p className="text-2xl font-black leading-none mb-1" style={{ color: 'var(--amount-color)' }}>
                {totalAll}
                <span className="text-sm font-semibold"> kr</span>
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                Samlet i sæsonen
              </p>
            </div>
            {/* Unpaid count */}
            <div className="text-center">
              <p className="text-2xl font-black leading-none mb-1"
                 style={{ color: unpaidCount > 0 ? '#f87171' : 'var(--text-secondary)' }}>
                {unpaidCount}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                Ubetalte bøder
              </p>
            </div>
            {/* Top debtor */}
            <div className="text-center">
              {topDebtor?.player ? (
                <>
                  <p className="text-sm font-black leading-tight mb-1"
                     style={{ color: 'var(--text-primary)' }}>
                    {topDebtor.player.name.split(' ').pop()}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                    Mest skyldig
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-1">
                    <Check size={20} style={{ color: '#4ade80' }} />
                  </div>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                    Ingen skyld
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {(['spillere', 'historik', 'regler'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={
                tab === t
                  ? {
                      background: 'var(--tab-active-bg)',
                      color: 'var(--tab-active-color)',
                      boxShadow: '0 2px 8px var(--tab-active-shadow)',
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              {t === 'spillere' ? 'Spillere' : t === 'historik' ? 'Historik' : 'Regler'}
            </button>
          ))}
        </div>

        {/* ── Spillere tab ────────────────────────────────────────── */}
        {tab === 'spillere' && (
          <div className="space-y-2">
            {sortedPlayers.length === 0 ? (
              <EmptyState
                icon={<Trophy size={32} style={{ color: 'var(--accent)' }} />}
                title="Ingen bøder endnu"
                sub="Ingen spillere skylder noget — så langt!"
              />
            ) : (
              sortedPlayers.map(({ pid, player, total, count, unpaid, unpaidAmt }, index) => {
                const rank = index + 1
                const rs = RANK_STYLE[rank]
                const personality = getPersonality(rank, unpaidAmt, count)
                return (
                <div
                  key={pid}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}
                >
                  {/* Rank badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: rs?.bg ?? 'var(--bg-raised)',
                      border: `1px solid ${rs?.border ?? 'var(--border)'}`,
                    }}
                  >
                    {rank === 1 ? (
                      <Trophy size={14} style={{ color: rs?.color }} />
                    ) : (
                      <span className="text-xs font-bold tabular-nums"
                            style={{ color: rs?.color ?? 'var(--text-muted)' }}>
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Name + personality */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {player!.name}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        {count} {count === 1 ? 'bøde' : 'bøder'}
                        {unpaid > 0 && (
                          <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                            · {unpaid} ubetalt{unpaid !== 1 ? 'e' : ''}
                          </span>
                        )}
                      </p>
                      {personality && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            background: unpaidAmt === 0 ? 'rgba(74,222,128,0.10)' : (rs?.bg ?? 'var(--bg-raised)'),
                            color: unpaidAmt === 0 ? '#4ade80' : (rs?.color ?? 'var(--text-faint)'),
                            border: `1px solid ${unpaidAmt === 0 ? 'rgba(74,222,128,0.20)' : (rs?.border ?? 'transparent')}`,
                          }}
                        >
                          {personality}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="font-black text-base leading-none" style={{ color: 'var(--amount-color)' }}>
                      {total} kr
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {unpaidAmt > 0 ? (
                        <span style={{ color: '#f87171' }}>{unpaidAmt} kr skyldig</span>
                      ) : (
                        <span style={{ color: '#4ade80' }}>alt betalt</span>
                      )}
                    </p>
                  </div>
                </div>
              )})
            )}

            {/* Trophy for clean slate */}
            {sortedPlayers.length > 0 && unpaidCount === 0 && (
              <div className="flex items-center gap-2 justify-center py-2">
                <Trophy size={14} style={{ color: '#4ade80' }} />
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  Alle bøder er betalt — godt gået!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Historik tab ────────────────────────────────────────── */}
        {tab === 'historik' && (
          <div className="space-y-2">
            {sortedFines.length === 0 ? (
              <EmptyState
                icon={<History size={32} style={{ color: 'var(--accent)' }} />}
                title="Ingen bøder"
                sub="Bøder du opretter vises her."
              />
            ) : (
              sortedFines.map((fine) => {
                const player = getPlayer(fine.playerId)
                return (
                  <div
                    key={fine.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}
                  >
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      {/* Paid indicator strip */}
                      <div
                        className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                        style={{ background: fine.paid ? '#4ade80' : 'var(--amount-color)' }}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                              {fine.label}
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                              {player?.name ?? 'Ukendt spiller'} · {fmtDayMonthYear(fine.date)}
                            </p>
                            {fine.note && (
                              <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-faint)' }}>
                                {fine.note}
                              </p>
                            )}
                          </div>
                          <p
                            className="font-black text-base shrink-0 leading-none"
                            style={{ color: fine.paid ? 'var(--text-faint)' : 'var(--amount-color)' }}
                          >
                            {fine.amount} kr
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2.5">
                          {/* Mark paid / unpaid — available to all */}
                          <button
                            onClick={() => togglePaid(fine.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold active:scale-95 transition-transform"
                            style={
                              fine.paid
                                ? {
                                    background: 'rgba(74,222,128,0.10)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(74,222,128,0.20)',
                                  }
                                : {
                                    background: 'var(--bg-raised)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border)',
                                  }
                            }
                          >
                            {fine.paid
                              ? <><CheckCircle2 size={11} /> Betalt</>
                              : <><Circle size={11} /> Ikke betalt</>}
                          </button>

                          {/* Delete — admin only */}
                          {isAdmin && (
                            <button
                              onClick={() => deleteFine(fine.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] active:scale-95 transition-transform"
                              style={{
                                background: 'rgba(239,68,68,0.08)',
                                color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.15)',
                              }}
                            >
                              <Trash2 size={11} />
                              Slet
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Regler tab ──────────────────────────────────────────── */}
        {tab === 'regler' && (
          <div className="space-y-3 pb-2">
            {CATEGORIES.map((cat) => {
              const types = FINE_TYPES.filter((t) => t.category === cat)
              return (
                <div
                  key={cat}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  {/* Category header */}
                  <div
                    className="px-4 py-2.5"
                    style={{ borderBottom: '1px solid var(--border-faint)' }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
                       style={{ color: 'var(--text-muted)' }}>
                      {CATEGORY_LABELS[cat]}
                    </p>
                  </div>

                  {/* Fine rows */}
                  {types.map((ft, i) => (
                    <div
                      key={ft.id}
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderTop: i === 0 ? 'none' : '1px solid var(--border-faint)',
                      }}
                    >
                      <p className="text-sm pr-4" style={{ color: 'var(--text-primary)' }}>
                        {ft.label}
                      </p>
                      <p
                        className="text-sm font-bold shrink-0"
                        style={{ color: 'var(--amount-color)' }}
                      >
                        {ft.amount} kr
                        {AMOUNT_SUFFIX[ft.id] && (
                          <span className="text-[11px] font-normal" style={{ color: 'var(--text-faint)' }}>
                            {AMOUNT_SUFFIX[ft.id]}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="text-center py-12 mt-2" style={{ color: 'var(--text-faint)' }}>
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <p className="text-sm mt-1">{sub}</p>
    </div>
  )
}
