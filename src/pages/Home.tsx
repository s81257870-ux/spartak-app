import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ChevronDown, Lock, LogOut, Flame, Share2, Trophy, Calendar, Sun, Moon, MapPin, Clock } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { useTrainingStore } from '../store/trainingStore'
import LeagueTable from '../components/stats/LeagueTable'
import { LEAGUE_TABLE, LEAGUE_NAME, CLUB_NAME, SEASON_LABEL } from '../data/leagueTable'
import PageHeader from '../components/layout/PageHeader'
import LoginModal from '../components/auth/LoginModal'
import { useThemeStore } from '../store/themeStore'
import NextMatchLineup from '../components/matches/NextMatchLineup'
import ClubCrest from '../components/ClubCrest'
import { isOversidder } from '../utils/matchTime'
import type { Training } from '../types'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })

export default function Home() {
  const navigate = useNavigate()
  const matches = useMatchStore((s) => s.matches)
  const players = usePlayerStore((s) => s.players)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)

  const isAdmin  = useAuthStore((s) => s.isAdmin)
  const logout   = useAuthStore((s) => s.logout)
  const { preference, setPreference } = useThemeStore()

  const [tableOpen, setTableOpen]   = useState(false)
  const [showLogin, setShowLogin]   = useState(false)

  const trainings        = useTrainingStore((s) => s.trainings)

  const completedMatches = matches.filter((m) => m.isCompleted)
  // Real upcoming matches: not completed, not Oversidder
  const upcomingMatches  = matches.filter((m) => !m.isCompleted && !isOversidder(m))
  const recentMatches    = completedMatches.filter((m) => !isOversidder(m)).slice(0, 3)
  const formMatches      = completedMatches.filter((m) => !isOversidder(m)).slice(0, 5)

  // Next activity: real match wins unless first upcoming is after the next training
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(new Date())
  const nextRealMatch = upcomingMatches.find((m) => m.date.slice(0, 10) >= today) ?? upcomingMatches[0] ?? null
  const nextTraining  = [...trainings]
    .filter((t) => !t.cancelled && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null

  // Show training card only when there's no real upcoming match,
  // OR the next real match is after the next training
  const showTrainingCard =
    !nextRealMatch ||
    (nextTraining !== null && nextTraining.date < nextRealMatch.date.slice(0, 10))

  const wins       = completedMatches.filter((m) => m.scoreUs > m.scoreThem).length
  const draws      = completedMatches.filter((m) => m.scoreUs === m.scoreThem).length
  const losses     = completedMatches.filter((m) => m.scoreUs < m.scoreThem).length
  const totalGoals = completedMatches.reduce((sum, m) => sum + m.scoreUs, 0)

  const playerStats = players.map((p) => ({ player: p, ...getPlayerStats(p.id) }))
  const topScorer   = [...playerStats].sort((a, b) => b.goals     - a.goals)[0]
  const topAssister = [...playerStats].sort((a, b) => b.assists   - a.assists)[0]

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
          style={{ background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)' }}
        />

        {/* ── Header row ─────────────────────────────────────── */}
        <div className="flex items-start justify-between relative">
          <div>
            <PageHeader label={SEASON_LABEL} title={CLUB_NAME} />
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {players.length} spillere i truppen
            </p>

            {/* Admin badge — only shown when logged in */}
            {isAdmin && (
              <div
                className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full border"
                style={{
                  background: 'var(--icon-accent-bg)',
                  borderColor: 'var(--badge-accent-border)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--accent)' }}>
                  Admin aktiv
                </span>
              </div>
            )}
          </div>

          {/* Right column: crest + auth + theme toggle */}
          <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
            <ClubCrest size={52} />
            <div className="flex items-center gap-2">
              {/* Theme toggle — compact icon-only */}
              <button
                onClick={() => setPreference(preference === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center w-6 h-6 rounded-full active:scale-90 transition-transform"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                aria-label="Skift tema"
              >
                {preference === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
              </button>
              {isAdmin ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-[10px] transition-opacity active:opacity-60"
                  style={{ color: 'var(--text-faint)' }}
                >
                  <LogOut size={10} />
                  Log ud
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-1 text-[10px] transition-opacity active:opacity-60"
                  style={{ color: 'var(--text-faint)' }}
                >
                  <Lock size={10} />
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Season narrative ──────────────────────────────── */}
        {completedMatches.length > 0 && (
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
               style={{ color: 'var(--text-muted)' }}>
              Sæsonen så langt
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {completedMatches.length} {completedMatches.length === 1 ? 'kamp' : 'kampe'}
              </span>{' '}
              spillet —{' '}
              <span className="font-semibold text-green-400">{wins} {wins === 1 ? 'sejr' : 'sejre'}</span>
              {draws > 0 && <>, <span className="font-semibold text-yellow-400">{draws} uafgjort{draws !== 1 ? 'e' : ''}</span></>}
              {losses > 0 && <>, <span className="font-semibold text-red-400">{losses} {losses === 1 ? 'nederlag' : 'nederlage'}</span></>}
              {' og '}
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>{totalGoals} {totalGoals === 1 ? 'mål' : 'mål'} scored</span>.
            </p>
          </div>
        )}

        {/* ── Next activity: real match OR training ─────────── */}
        {!showTrainingCard && nextRealMatch && (
          <div>
            <SectionLabel>Næste kamp</SectionLabel>
            <button
              onClick={() => navigate(`/kampe/${nextRealMatch.id}`)}
              className="w-full rounded-2xl p-4 md:p-6 text-left active:scale-[0.97] transition-all duration-150 relative overflow-hidden cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, var(--accent-card-tint) 0%, var(--bg-card) 60%)`,
                border: '1px solid var(--accent-card-border)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(149,197,233,0.14), 0 2px 8px rgba(0,0,0,0.15)'
                e.currentTarget.style.borderColor = 'rgba(149,197,233,0.38)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'
                e.currentTarget.style.borderColor = 'var(--accent-card-border)'
              }}
            >
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                style={{ background: 'var(--accent-stripe)' }}
              />
              <div className="pl-3">
                <NextMatchLineup match={nextRealMatch} allPlayers={players} />
              </div>
            </button>
          </div>
        )}

        {showTrainingCard && nextTraining && (
          <div>
            <SectionLabel>Næste træning</SectionLabel>
            <NextTrainingCard training={nextTraining} />
          </div>
        )}

        {/* ── Form strip ────────────────────────────────────── */}
        <div
          className="rounded-2xl px-4 py-3.5 flex items-center gap-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] shrink-0"
             style={{ color: 'var(--text-muted)' }}>
            Form
          </p>
          {formMatches.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>
              Ingen resultater endnu — sæsonen starter snart
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const m    = formMatches[i]
                  const won  = m && m.scoreUs > m.scoreThem
                  const draw = m && m.scoreUs === m.scoreThem
                  return m ? (
                    <div
                      key={m.id}
                      title={won ? 'Sejr' : draw ? 'Uafgjort' : 'Nederlag'}
                      className="w-6 h-6 rounded-full shrink-0"
                      style={{
                        background: won ? 'rgba(74,222,128,0.20)' : draw ? 'rgba(250,204,21,0.20)' : 'rgba(248,113,113,0.20)',
                        border: `1.5px solid ${won ? '#4ade80' : draw ? '#facc15' : '#f87171'}`,
                        boxShadow: `0 0 6px ${won ? 'rgba(74,222,128,0.18)' : draw ? 'rgba(250,204,21,0.18)' : 'rgba(248,113,113,0.18)'}`,
                      }}
                    />
                  ) : (
                    <div
                      key={`empty-${i}`}
                      className="w-6 h-6 rounded-full shrink-0 opacity-20"
                      style={{ border: '1.5px solid var(--text-faint)', background: 'transparent' }}
                    />
                  )
                })}
              </div>
              <p className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--text-faint)' }}>
                {formMatches.length === 1 ? 'sidste kamp' : `sidste ${formMatches.length}`}
              </p>
            </>
          )}
        </div>

        {/* ── Top scorer + top assister ─────────────────────── */}
        <div>
          <SectionLabel>Sæsonens bedste</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {/* Top scorer */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--icon-accent-bg)', color: 'var(--accent)' }}
              >
                <Flame size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--text-muted)' }}>
                  Topscorer
                </p>
                <p className="font-semibold text-sm truncate leading-tight"
                   style={{ color: 'var(--text-primary)' }}>
                  {topScorer ? topScorer.player.name.split(' ')[0] : '—'}
                </p>
                <p className="text-[10px] truncate leading-tight"
                   style={{ color: 'var(--text-faint)' }}>
                  {topScorer ? topScorer.player.name.split(' ').slice(1).join(' ') : ''}
                </p>
              </div>
              <p
                className="font-display text-4xl leading-none"
                style={{ color: 'var(--accent)', textShadow: '0 0 16px rgba(149,197,233,0.35)' }}
              >
                {topScorer?.goals ?? 0}
                <span className="text-[11px] font-semibold ml-1" style={{ color: 'var(--text-faint)', fontFamily: 'inherit' }}>mål</span>
              </p>
            </div>

            {/* Top assister */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--icon-accent-bg)', color: 'var(--accent)' }}
              >
                <Share2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--text-muted)' }}>
                  Flest assists
                </p>
                <p className="font-semibold text-sm truncate leading-tight"
                   style={{ color: 'var(--text-primary)' }}>
                  {topAssister ? topAssister.player.name.split(' ')[0] : '—'}
                </p>
                <p className="text-[10px] truncate leading-tight"
                   style={{ color: 'var(--text-faint)' }}>
                  {topAssister ? topAssister.player.name.split(' ').slice(1).join(' ') : ''}
                </p>
              </div>
              <p
                className="font-display text-4xl leading-none"
                style={{ color: 'var(--accent)', textShadow: '0 0 16px rgba(149,197,233,0.35)' }}
              >
                {topAssister?.assists ?? 0}
                <span className="text-[11px] font-semibold ml-1" style={{ color: 'var(--text-faint)', fontFamily: 'inherit' }}>ast</span>
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
                className="text-xs flex items-center gap-0.5 active:opacity-70 -mt-1"
                style={{ color: 'var(--accent)' }}
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
                    className="w-full rounded-xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}
                  >
                    <div className={`w-1.5 h-8 rounded-full shrink-0 ${won ? 'bg-green-400' : draw ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        vs. {match.opponent}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(match.date)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {match.scoreUs}–{match.scoreThem}
                      </p>
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
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setTableOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 active:opacity-75 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: 'var(--icon-accent-bg)', color: 'var(--accent)' }}>
                <Trophy size={14} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Stilling
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  {CLUB_NAME} · #{spartakPos} af {totalTeams} hold
                </p>
              </div>
            </div>
            <ChevronDown
              size={16}
              className="transition-transform duration-200"
              style={{ color: 'var(--text-muted)', transform: tableOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {tableOpen && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <LeagueTable rows={LEAGUE_TABLE} leagueName={LEAGUE_NAME} />
            </div>
          )}
        </div>

        {/* ── Quick actions — admin only ─────────────────────── */}
        {isAdmin && (
          <button
            onClick={() => navigate('/kampe/ny')}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm active:scale-[0.97] transition-transform"
            style={{
              background: 'var(--cta-bg)',
              color: 'var(--cta-color)',
              boxShadow: '0 8px 24px var(--cta-shadow)',
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
            Opret ny kamp
          </button>
        )}

        {/* ── Empty state ───────────────────────────────────── */}
        {completedMatches.length === 0 && upcomingMatches.length === 0 && (
          <div className="text-center py-12 mt-2" style={{ color: 'var(--text-faint)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                 style={{ background: 'var(--bg-raised)', color: 'var(--text-faint)' }}>
              <Calendar size={28} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Ingen kampe endnu</p>
            <p className="text-sm mt-1">Opret din første kamp herover</p>
          </div>
        )}

      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3"
       style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

function NextTrainingCard({ training }: { training: Training }) {
  const navigate = useNavigate()
  const dateLabel = new Date(training.date + 'T12:00:00').toLocaleDateString('da-DK', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <button
      onClick={() => navigate('/træninger')}
      className="w-full rounded-2xl p-4 text-left active:scale-[0.97] transition-all duration-150 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--accent-card-tint) 0%, var(--bg-card) 60%)`,
        border: '1px solid var(--accent-card-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(149,197,233,0.14), 0 2px 8px rgba(0,0,0,0.15)'
        e.currentTarget.style.borderColor = 'rgba(149,197,233,0.38)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'
        e.currentTarget.style.borderColor = 'var(--accent-card-border)'
      }}
    >
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ background: 'var(--accent-stripe)' }}
      />
      <div className="pl-3">
        <p className="font-bold text-base capitalize" style={{ color: 'var(--text-primary)' }}>
          {dateLabel}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Clock size={13} strokeWidth={2} />
            {training.time}
          </span>
          <span className="flex items-center gap-1.5 text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
            <MapPin size={13} strokeWidth={2} />
            {training.location}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: '1px solid var(--border-faint)' }}>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Tilmeld dig træningen</span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
            Se træning <ChevronRight size={14} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  )
}

