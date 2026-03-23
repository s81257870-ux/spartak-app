import { useState } from 'react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import { Trophy, Target, Users } from 'lucide-react'
import { displayName } from '../utils/playerName'
import type { Player } from '../types'

type SortKey = 'goals' | 'assists' | 'matchesPlayed' | 'yellowCards' | 'redCards'

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'goals',         label: 'Mål'      },
  { key: 'assists',       label: 'Assists'   },
  { key: 'matchesPlayed', label: 'Kampe'     },
  { key: 'yellowCards',   label: '🟡 Gule'  },
  { key: 'redCards',      label: '🔴 Røde'  },
]

export default function Stats() {
  const players = usePlayerStore((s) => s.players)
  const matches = useMatchStore((s) => s.matches)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)
  const [sortBy, setSortBy] = useState<SortKey>('goals')

  const completedMatches = matches.filter((m) => m.isCompleted)
  const totalGoals = completedMatches.reduce((sum, m) => sum + m.scoreUs, 0)
  const wins = completedMatches.filter((m) => m.scoreUs > m.scoreThem).length
  const winRate = completedMatches.length > 0
    ? Math.round((wins / completedMatches.length) * 100)
    : 0

  const allStats = players
    .map((p) => ({ player: p, stats: getPlayerStats(p.id) }))
    .sort((a, b) => b.stats[sortBy] - a.stats[sortBy])

  const topScorerFixed  = [...allStats].sort((a, b) => b.stats.goals   - a.stats.goals)[0]
  const topAssistsFixed = [...allStats].sort((a, b) => b.stats.assists - a.stats.assists)[0]

  return (
    <div className="pb-8">

      {/* ── Hero header ───────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-7 overflow-hidden">
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full" style={{ background: 'var(--section-bar-bg)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: 'var(--section-label-color)' }}>
              Sæson 2025
            </span>
          </div>
          <h1 className="text-[2rem] font-black tracking-tight leading-none mb-1.5"
              style={{ color: 'var(--text-primary)' }}>
            Statistik
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {completedMatches.length === 0
              ? 'Ingen afsluttede kampe endnu'
              : `${completedMatches.length} kamp${completedMatches.length !== 1 ? 'e' : ''} · ${winRate}% sejrsrate`}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6">

        {/* ── Summary row ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard icon={<Users size={15} />}  label="Kampe"  value={completedMatches.length} accent={false} />
          <SummaryCard icon={<Trophy size={15} />} label="Sejre"  value={wins}        accent />
          <SummaryCard icon={<Target size={15} />} label="Mål"    value={totalGoals}  accent />
        </div>

        {/* ── Top performers ────────────────────────────────── */}
        <section>
          <SectionLabel>Topspillere</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <TopCard
              title="Topscorer"
              emoji="⚽"
              player={topScorerFixed?.player}
              value={topScorerFixed?.stats.goals ?? 0}
              unit="mål"
              players={players}
            />
            <TopCard
              title="Flest assists"
              emoji="🎯"
              player={topAssistsFixed?.player}
              value={topAssistsFixed?.stats.assists ?? 0}
              unit="ast"
              players={players}
            />
          </div>
        </section>

        {/* ── Full leaderboard ──────────────────────────────── */}
        <section>
          <SectionLabel>Alle spillere</SectionLabel>

          {/* Sort pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-3"
               style={{ scrollbarWidth: 'none' }}>
            {SORT_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap active:scale-95"
                style={
                  sortBy === key
                    ? {
                        background: 'var(--tab-active-bg)',
                        color: 'var(--tab-active-color)',
                        border: '1px solid transparent',
                        boxShadow: '0 4px 16px var(--tab-active-shadow)',
                      }
                    : {
                        background: 'var(--bg-raised)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Column headers */}
            <div
              className="grid grid-cols-[1fr_repeat(5,_auto)] gap-x-1 px-4 py-2.5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-faint)' }}>
                Spiller
              </span>
              {(['Mål', 'Ast', 'Kmp', '🟡', '🔴'] as const).map((h, i) => (
                <span key={i} className="w-8 text-center text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div>
              {allStats.map(({ player, stats }, i) => {
                const isFirst = i === 0
                return (
                  <div
                    key={player.id}
                    className="grid grid-cols-[1fr_repeat(5,_auto)] gap-x-1 px-4 py-3.5 items-center"
                    style={{
                      background:  isFirst ? 'rgba(249,115,22,0.04)' : undefined,
                      borderTop:   i > 0 ? '1px solid var(--border-faint)' : undefined,
                    }}
                  >
                    {/* Player identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-[11px] w-4 shrink-0 font-bold tabular-nums ${isFirst ? 'text-orange-400' : ''}`}
                            style={isFirst ? {} : { color: 'var(--text-dimmer)' }}>
                        {i + 1}
                      </span>
                      <PlayerAvatar name={player.name} size="sm" />
                      <span className="text-sm truncate font-medium"
                            style={{ color: isFirst ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {displayName(player, players)}
                      </span>
                    </div>

                    {/* Goals */}
                    <span className={`w-8 text-center font-bold text-sm tabular-nums ${
                      sortBy === 'goals' ? 'text-orange-400' : ''
                    }`}
                    style={sortBy !== 'goals' ? { color: 'var(--text-secondary)' } : {}}>
                      {stats.goals}
                    </span>

                    {/* Assists */}
                    <span className={`w-8 text-center font-bold text-sm tabular-nums ${
                      sortBy === 'assists' ? 'text-orange-400' : ''
                    }`}
                    style={sortBy !== 'assists' ? { color: 'var(--text-muted)' } : {}}>
                      {stats.assists}
                    </span>

                    {/* Matches played */}
                    <span className={`w-8 text-center font-bold text-sm tabular-nums ${
                      sortBy === 'matchesPlayed' ? 'text-orange-400' : ''
                    }`}
                    style={sortBy !== 'matchesPlayed' ? { color: 'var(--text-muted)' } : {}}>
                      {stats.matchesPlayed}
                    </span>

                    {/* Yellow cards */}
                    <span className={`w-8 text-center font-bold text-sm tabular-nums ${
                      sortBy === 'yellowCards'
                        ? 'text-yellow-400'
                        : stats.yellowCards > 0
                          ? 'text-yellow-500/60'
                          : ''
                    }`}
                    style={sortBy !== 'yellowCards' && stats.yellowCards === 0 ? { color: 'var(--text-dimmer)' } : {}}>
                      {stats.yellowCards || '–'}
                    </span>

                    {/* Red cards */}
                    <span className={`w-8 text-center font-bold text-sm tabular-nums ${
                      sortBy === 'redCards'
                        ? 'text-red-400'
                        : stats.redCards > 0
                          ? 'text-red-500/60'
                          : ''
                    }`}
                    style={sortBy !== 'redCards' && stats.redCards === 0 ? { color: 'var(--text-dimmer)' } : {}}>
                      {stats.redCards || '–'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3"
       style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

function SummaryCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center mb-3 ${
          accent ? 'text-orange-400' : ''
        }`}
        style={{
          background: accent ? 'rgba(249,115,22,0.12)' : 'var(--bg-raised)',
          color: accent ? undefined : 'var(--text-secondary)',
        }}
      >
        {icon}
      </div>
      <p
        className={`text-2xl font-black leading-none mb-1 ${accent ? 'text-orange-400' : ''}`}
        style={accent
          ? { textShadow: '0 0 20px rgba(249,115,22,0.4)' }
          : { color: 'var(--text-primary)' }}
      >
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function TopCard({
  title, emoji, player, value, unit, players,
}: {
  title: string
  emoji: string
  player: Player | undefined
  value: number
  unit: string
  players: Player[]
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col justify-between min-h-[110px]"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider leading-tight"
           style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <span className="text-base leading-none">{emoji}</span>
      </div>
      <div>
        <p className="font-bold text-sm leading-tight truncate mb-0.5"
           style={{ color: 'var(--text-primary)' }}>
          {player ? displayName(player, players) : '—'}
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-black text-orange-400 leading-none"
            style={{ textShadow: '0 0 16px rgba(249,115,22,0.35)' }}
          >
            {value}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
    </div>
  )
}
