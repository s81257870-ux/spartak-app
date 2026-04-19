import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import PlayerAvatar from '../components/players/PlayerAvatar'
import LeagueTable from '../components/stats/LeagueTable'
import { Trophy, Target, Users, Flame, Share2 } from 'lucide-react'
import { displayName } from '../utils/playerName'
import type { Player } from '../types'
import { SEASON_LABEL, LEAGUE_TABLE, LEAGUE_NAME } from '../data/leagueTable'
import PageHeader from '../components/layout/PageHeader'

type SortKey = 'goals' | 'assists' | 'matchesPlayed' | 'yellowCards' | 'redCards'

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'goals',         label: 'Mål'      },
  { key: 'assists',       label: 'Assists'   },
  { key: 'matchesPlayed', label: 'Kampe'     },
  { key: 'yellowCards',   label: 'Gule'     },
  { key: 'redCards',      label: 'Røde'     },
]

export default function Stats() {
  const navigate = useNavigate()
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
          <PageHeader label={SEASON_LABEL} title="Statistik" />
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
              icon={<Flame size={14} />}
              player={topScorerFixed?.player}
              value={topScorerFixed?.stats.goals ?? 0}
              unit="mål"
              players={players}
            />
            <TopCard
              title="Flest assists"
              icon={<Share2 size={14} />}
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
              {(['Mål', 'Ast', 'Kmp'] as const).map((h, i) => (
                <span key={i} className="w-8 text-center text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-faint)' }}>
                  {h}
                </span>
              ))}
              {/* Yellow card header — small card rectangle */}
              <span className="w-8 flex items-center justify-center">
                <span className="w-[9px] h-[12px] rounded-[2px]" style={{ background: 'rgba(250,204,21,0.55)' }} />
              </span>
              {/* Red card header */}
              <span className="w-8 flex items-center justify-center">
                <span className="w-[9px] h-[12px] rounded-[2px]" style={{ background: 'rgba(248,113,113,0.55)' }} />
              </span>
            </div>

            {/* Rows */}
            <div>
              {allStats.map(({ player, stats }, i) => {
                const isFirst = i === 0
                return (
                  <div
                    key={player.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/spillere/${player.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/spillere/${player.id}`)}
                    className="grid grid-cols-[1fr_repeat(5,_auto)] gap-x-1 px-4 py-3.5 items-center active:opacity-70"
                    style={{
                      background:  isFirst ? 'rgba(220,38,38,0.04)' : undefined,
                      borderTop:   i > 0 ? '1px solid var(--border-faint)' : undefined,
                      cursor:      'pointer',
                      transition:  'opacity 120ms ease',
                    }}
                  >
                    {/* Player identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] w-4 shrink-0 font-bold tabular-nums"
                            style={{ color: isFirst ? 'var(--accent)' : 'var(--text-dimmer)' }}>
                        {i + 1}
                      </span>
                      <PlayerAvatar name={player.name} size="sm" />
                      <span className="text-sm truncate font-medium"
                            style={{ color: isFirst ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {displayName(player, players)}
                      </span>
                    </div>

                    {/* Goals */}
                    <span className="w-8 text-center font-bold text-sm tabular-nums"
                    style={{ color: sortBy === 'goals' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {stats.goals}
                    </span>

                    {/* Assists */}
                    <span className="w-8 text-center font-bold text-sm tabular-nums"
                    style={{ color: sortBy === 'assists' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {stats.assists}
                    </span>

                    {/* Matches played */}
                    <span className="w-8 text-center font-bold text-sm tabular-nums"
                    style={{ color: sortBy === 'matchesPlayed' ? 'var(--accent)' : 'var(--text-muted)' }}>
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

        {/* ── League table ──────────────────────────────────── */}
        <section>
          <SectionLabel>Stilling</SectionLabel>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <LeagueTable rows={LEAGUE_TABLE} leagueName={LEAGUE_NAME} />
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
        className="w-7 h-7 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: accent ? 'var(--icon-accent-bg)' : 'var(--bg-raised)',
          color: accent ? 'var(--accent)' : 'var(--text-secondary)',
        }}
      >
        {icon}
      </div>
      <p
        className="font-display text-3xl leading-none mb-1"
        style={accent
          ? { color: 'var(--accent)', textShadow: '0 0 20px rgba(220,38,38,0.30)' }
          : { color: 'var(--text-primary)' }}
      >
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function TopCard({
  title, icon, player, value, unit, players,
}: {
  title: string
  icon: React.ReactNode
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
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--icon-accent-bg)', color: 'var(--accent)' }}
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="font-bold text-sm leading-tight truncate mb-0.5"
           style={{ color: 'var(--text-primary)' }}>
          {player ? displayName(player, players) : '—'}
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className="font-display text-3xl leading-none"
            style={{ color: 'var(--accent)', textShadow: '0 0 16px rgba(220,38,38,0.30)' }}
          >
            {value}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
    </div>
  )
}
