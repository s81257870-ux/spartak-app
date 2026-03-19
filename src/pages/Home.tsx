import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ChevronDown, Lock, LogOut } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import LeagueTable from '../components/stats/LeagueTable'
import { LEAGUE_TABLE, LEAGUE_NAME } from '../data/leagueTable'
import LoginModal from '../components/auth/LoginModal'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })

export default function Home() {
  const navigate = useNavigate()
  const matches = useMatchStore((s) => s.matches)
  const players = usePlayerStore((s) => s.players)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)

  const isAdmin  = useAuthStore((s) => s.isAdmin)
  const logout   = useAuthStore((s) => s.logout)

  const [tableOpen, setTableOpen]   = useState(false)
  const [showLogin, setShowLogin]   = useState(false)

  const completedMatches = matches.filter((m) => m.isCompleted)
  const upcomingMatches  = matches.filter((m) => !m.isCompleted)
  const recentMatches    = completedMatches.slice(0, 3)

  const wins       = completedMatches.filter((m) => m.scoreUs > m.scoreThem).length
  const draws      = completedMatches.filter((m) => m.scoreUs === m.scoreThem).length
  const losses     = completedMatches.filter((m) => m.scoreUs < m.scoreThem).length
  const totalGoals = completedMatches.reduce((sum, m) => sum + m.scoreUs, 0)

  const playerStats = players.map((p) => ({ player: p, ...getPlayerStats(p.id) }))
  const topScorer   = [...playerStats].sort((a, b) => b.goals     - a.goals)[0]
  const topAssister = [...playerStats].sort((a, b) => b.assists   - a.assists)[0]

  // Spartak's current position in the league table
  const spartakRow    = LEAGUE_TABLE.find((r) => r.isSpartak)
  const spartakPos    = spartakRow?.position ?? '–'
  const totalTeams    = LEAGUE_TABLE.length

  return (
    <div className="pb-8">

      {/* ── Login modal ────────────────────────────────────── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* ── Club hero ──────────────────────────────────────── */}
      <div className="relative px-4 pt-10 pb-7 overflow-hidden">
        <div
          className="absolute -top-6 right-0 w-56 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 70%)' }}
        />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">
              Sæson 2025
            </p>
            <h1 className="text-[2rem] font-black text-white tracking-tight leading-none">
              Spartak
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {players.length} spillere i truppen
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* Club crest */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: '0 8px 24px rgba(220,38,38,0.30)',
              }}
            >
              <span className="text-white font-black text-2xl leading-none">S</span>
            </div>
            {/* Auth button */}
            {isAdmin ? (
              <button
                onClick={logout}
                className="flex items-center gap-1 text-[10px] text-slate-500 active:text-orange-400 transition-colors"
              >
                <LogOut size={10} />
                Log ud
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1 text-[10px] text-slate-600 active:text-orange-400 transition-colors"
              >
                <Lock size={10} />
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Admin badge */}
        {isAdmin && (
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full border"
            style={{
              background: 'rgba(249,115,22,0.08)',
              borderColor: 'rgba(249,115,22,0.25)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">
              Admin-tilstand aktiv
            </span>
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">

        {/* ── Season record ─────────────────────────────────── */}
        {completedMatches.length > 0 && (
          <div
            className="rounded-2xl p-4 border border-white/[0.06]"
            style={{ background: '#12131c' }}
          >
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.12em] mb-4">
              Sæsonform
            </p>
            <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
              <RecordItem value={wins}       label="Sejre"    color="text-green-400" />
              <RecordItem value={draws}      label="Uafgjort" color="text-yellow-400" />
              <RecordItem value={losses}     label="Nederlag" color="text-red-400" />
              <RecordItem value={totalGoals} label="Mål"      color="text-orange-400" />
            </div>
          </div>
        )}

        {/* ── Next match ────────────────────────────────────── */}
        {upcomingMatches.length > 0 && (
          <div>
            <SectionLabel>Næste kamp</SectionLabel>
            <button
              onClick={() => navigate(`/kampe/${upcomingMatches[0].id}`)}
              className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform relative overflow-hidden border border-orange-500/20"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, #12131c 60%)' }}
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                style={{ background: 'linear-gradient(180deg, #f97316, #fbbf24)' }}
              />
              <div className="pl-3">
                <p className="text-white font-bold text-base leading-tight">
                  Spartak vs. {upcomingMatches[0].opponent}
                </p>
                <p className="text-orange-400/80 text-sm mt-0.5">
                  {formatDate(upcomingMatches[0].date)} · {upcomingMatches[0].location}
                </p>
                <p className="text-slate-600 text-xs mt-2">Tryk for at se kamp →</p>
              </div>
            </button>
          </div>
        )}

        {/* ── Top scorer + top assister ─────────────────────── */}
        <div>
          <SectionLabel>Sæsonens bedste</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {/* Top scorer */}
            <div
              className="rounded-2xl p-4 border border-white/[0.06] flex flex-col gap-3"
              style={{ background: '#12131c' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: 'rgba(249,115,22,0.12)' }}
              >
                ⚽
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Topscorer
                </p>
                <p className="text-white font-semibold text-sm truncate leading-tight">
                  {topScorer ? topScorer.player.name.split(' ')[0] : '—'}
                </p>
                <p className="text-slate-600 text-[10px] truncate leading-tight">
                  {topScorer ? topScorer.player.name.split(' ').slice(1).join(' ') : ''}
                </p>
              </div>
              <p
                className="text-3xl font-black text-orange-400 leading-none"
                style={{ textShadow: '0 0 16px rgba(249,115,22,0.35)' }}
              >
                {topScorer?.goals ?? 0}
                <span className="text-[11px] text-slate-600 font-semibold ml-1">mål</span>
              </p>
            </div>

            {/* Top assister */}
            <div
              className="rounded-2xl p-4 border border-white/[0.06] flex flex-col gap-3"
              style={{ background: '#12131c' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: 'rgba(99,102,241,0.12)' }}
              >
                🎯
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Flest assists
                </p>
                <p className="text-white font-semibold text-sm truncate leading-tight">
                  {topAssister ? topAssister.player.name.split(' ')[0] : '—'}
                </p>
                <p className="text-slate-600 text-[10px] truncate leading-tight">
                  {topAssister ? topAssister.player.name.split(' ').slice(1).join(' ') : ''}
                </p>
              </div>
              <p
                className="text-3xl font-black text-indigo-400 leading-none"
                style={{ textShadow: '0 0 16px rgba(99,102,241,0.35)' }}
              >
                {topAssister?.assists ?? 0}
                <span className="text-[11px] text-slate-600 font-semibold ml-1">ast</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Recent results ────────────────────────────────── */}
        {recentMatches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Seneste kampe</SectionLabel>
              <button
                onClick={() => navigate('/kampe')}
                className="text-orange-400/70 text-xs flex items-center gap-0.5 active:opacity-70 -mt-1"
              >
                Se alle <ChevronRight size={13} />
              </button>
            </div>
            <div className="space-y-2">
              {recentMatches.map((match) => {
                const won  = match.scoreUs > match.scoreThem
                const draw = match.scoreUs === match.scoreThem
                return (
                  <button
                    key={match.id}
                    onClick={() => navigate(`/kampe/${match.id}`)}
                    className="w-full rounded-xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-left border border-white/[0.05]"
                    style={{ background: '#12131c' }}
                  >
                    <div className={`w-1.5 h-8 rounded-full shrink-0 ${won ? 'bg-green-400' : draw ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">vs. {match.opponent}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{formatDate(match.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold text-sm">{match.scoreUs}–{match.scoreThem}</p>
                      <p className={`text-[10px] font-semibold ${won ? 'text-green-400' : draw ? 'text-yellow-400' : 'text-red-400'}`}>
                        {won ? 'Sejr' : draw ? 'Uafgjort' : 'Nederlag'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── League table (collapsible) ─────────────────────── */}
        <div
          className="rounded-2xl border border-white/[0.06] overflow-hidden"
          style={{ background: '#12131c' }}
        >
          {/* Accordion header – always visible */}
          <button
            onClick={() => setTableOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 active:opacity-75 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🏆</span>
              <div className="text-left">
                <p className="text-white text-sm font-semibold leading-tight">Stilling</p>
                <p className="text-slate-600 text-[10px] mt-0.5">
                  Spartak · #{spartakPos} af {totalTeams} hold
                </p>
              </div>
            </div>
            <ChevronDown
              size={16}
              className="text-slate-500 transition-transform duration-200"
              style={{ transform: tableOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Expandable table */}
          {tableOpen && (
            <div className="border-t border-white/[0.06]">
              <LeagueTable rows={LEAGUE_TABLE} leagueName={LEAGUE_NAME} />
            </div>
          )}
        </div>

        {/* ── Quick actions ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {isAdmin && (
            <button
              onClick={() => navigate('/kampe/ny')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 font-bold text-sm active:scale-[0.97] transition-transform text-black"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                boxShadow: '0 8px 24px rgba(249,115,22,0.30)',
              }}
            >
              <Plus size={22} strokeWidth={2.5} />
              Ny kamp
            </button>
          )}
          <button
            onClick={() => navigate('/statistik')}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-5 font-semibold text-sm active:scale-[0.97] transition-transform text-white border border-white/[0.06] ${isAdmin ? '' : 'col-span-2'}`}
            style={{ background: '#12131c' }}
          >
            <span className="text-xl">📊</span>
            Statistik
          </button>
        </div>

        {/* ── Empty state ───────────────────────────────────── */}
        {completedMatches.length === 0 && upcomingMatches.length === 0 && (
          <div className="text-center py-12 text-slate-600 mt-2">
            <p className="text-3xl mb-3">🏟️</p>
            <p className="font-semibold text-slate-400">Ingen kampe endnu</p>
            <p className="text-sm mt-1">Opret din første kamp herover</p>
          </div>
        )}

      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.12em] mb-3">
      {children}
    </p>
  )
}

function RecordItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center px-2">
      <p className={`text-2xl font-black leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-slate-600 text-[10px] font-medium">{label}</p>
    </div>
  )
}
