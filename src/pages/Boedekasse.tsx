import { useState, useMemo } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, Trophy } from 'lucide-react'
import { useFineStore } from '../store/fineStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import NewFineModal from '../components/boedekasse/NewFineModal'

type Tab = 'spillere' | 'historik'

function formatDanishDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
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
  const unpaidFines   = fines.filter((f) => !f.paid)
  const totalUnpaid   = unpaidFines.reduce((sum, f) => sum + f.amount, 0)
  const unpaidCount   = unpaidFines.length

  // Per-player unpaid totals — only players with at least one fine
  const playerTotals = useMemo(() => {
    const map = new Map<string, { total: number; count: number; unpaid: number }>()
    for (const f of fines) {
      const existing = map.get(f.playerId) ?? { total: 0, count: 0, unpaid: 0 }
      map.set(f.playerId, {
        total:  existing.total  + (f.paid ? 0 : f.amount),
        count:  existing.count  + 1,
        unpaid: existing.unpaid + (f.paid ? 0 : 1),
      })
    }
    return map
  }, [fines])

  // Player who owes the most (unpaid)
  const topDebtor = useMemo(() => {
    let max = 0
    let pid = ''
    playerTotals.forEach((v, k) => {
      if (v.total > max) { max = v.total; pid = k }
    })
    return pid ? { player: getPlayer(pid), amount: max } : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerTotals])

  // Sorted player list by unpaid amount desc
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
    <div className="pb-8">

      {showModal && <NewFineModal onClose={() => setShowModal(false)} />}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-10 pb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
               style={{ color: 'var(--text-muted)' }}>
              Spartak Ciervo
            </p>
            <h1 className="text-[2rem] font-black tracking-tight leading-none"
                style={{ color: 'var(--text-primary)' }}>
              Bødekasse
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform text-black"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                boxShadow:  '0 4px 16px rgba(249,115,22,0.30)',
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
            {/* Total unpaid */}
            <div className="text-center">
              <p className="text-2xl font-black leading-none mb-1 text-orange-400">
                {totalUnpaid}
                <span className="text-sm font-semibold"> kr</span>
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                Samlet skyldig
              </p>
            </div>
            {/* Unpaid count */}
            <div className="text-center">
              <p className="text-2xl font-black leading-none mb-1 text-red-400">
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
                  <p className="text-2xl font-black leading-none mb-1 text-green-400">✓</p>
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
          {(['spillere', 'historik'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={
                tab === t
                  ? {
                      background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                      color: '#000',
                      boxShadow: '0 2px 8px rgba(249,115,22,0.28)',
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              {t === 'spillere' ? 'Spillere' : 'Historik'}
            </button>
          ))}
        </div>

        {/* ── Spillere tab ────────────────────────────────────────── */}
        {tab === 'spillere' && (
          <div className="space-y-2">
            {sortedPlayers.length === 0 ? (
              <EmptyState
                icon="🏆"
                title="Ingen bøder endnu"
                sub="Ingen spillere skylder noget — så langt!"
              />
            ) : (
              sortedPlayers.map(({ pid, player, total, count, unpaid }) => (
                <div
                  key={pid}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{
                      background: total > 0
                        ? 'linear-gradient(135deg, rgba(249,115,22,0.20), rgba(251,191,36,0.15))'
                        : 'var(--bg-raised)',
                      color: total > 0 ? '#f97316' : 'var(--text-muted)',
                    }}
                  >
                    {player!.name.charAt(0)}
                  </div>

                  {/* Name + count */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {player!.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {count} {count === 1 ? 'bøde' : 'bøder'}
                      {unpaid > 0 && (
                        <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>
                          · {unpaid} ubetalt{unpaid !== 1 ? 'e' : ''}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p
                      className="font-black text-base leading-none"
                      style={{ color: total > 0 ? '#f97316' : '#4ade80' }}
                    >
                      {total > 0 ? `${total} kr` : '0 kr'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {total > 0 ? 'skyldig' : 'betalt'}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Trophy for clean slate */}
            {sortedPlayers.length > 0 && totalUnpaid === 0 && (
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
                icon="📋"
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
                        style={{ background: fine.paid ? '#4ade80' : '#f97316' }}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                              {fine.label}
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                              {player?.name ?? 'Ukendt spiller'} · {formatDanishDate(fine.date)}
                            </p>
                            {fine.note && (
                              <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-faint)' }}>
                                {fine.note}
                              </p>
                            )}
                          </div>
                          <p
                            className="font-black text-base shrink-0 leading-none"
                            style={{ color: fine.paid ? 'var(--text-faint)' : '#f97316' }}
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

      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="text-center py-12 mt-2" style={{ color: 'var(--text-faint)' }}>
      <p className="text-3xl mb-3">{icon}</p>
      <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <p className="text-sm mt-1">{sub}</p>
    </div>
  )
}
