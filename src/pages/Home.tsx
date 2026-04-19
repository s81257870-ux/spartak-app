import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Flame, Share2, Calendar, Sun, Moon, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'
import { usePlayerStore } from '../store/playerStore'
import { useAuthStore } from '../store/authStore'
import { useTrainingStore } from '../store/trainingStore'
import { CLUB_NAME, SEASON_LABEL } from '../data/leagueTable'
import PageHeader from '../components/layout/PageHeader'
import { useThemeStore } from '../store/themeStore'
import NextMatchLineup from '../components/matches/NextMatchLineup'
import ClubCrest from '../components/ClubCrest'
import PlayerAvatar from '../components/players/PlayerAvatar'
import { isOversidder } from '../utils/matchTime'
import type { Player, Training } from '../types'

// ── Training card helpers (mirrors Trainings.tsx) ─────────────────────────────

const THRESHOLD = 10

type AttState = 'low' | 'lowmedium' | 'medium' | 'high' | 'full'
function attState(n: number): AttState {
  if (n >= THRESHOLD) return 'full'
  if (n >= 8) return 'high'
  if (n >= 6) return 'medium'
  if (n >= 4) return 'lowmedium'
  return 'low'
}
const STATE_COLOR: Record<AttState, string> = {
  low: '#fc8a4a', lowmedium: '#fb923c', medium: '#fbbf24', high: '#a3e635', full: '#4ade80',
}
const STATE_LABEL: Record<AttState, string> = {
  low: 'Er I døde eller hvad?', lowmedium: 'Slet ikke nok...', medium: 'Det begynder at ligne noget',
  high: 'SÅ TÆT', full: 'Holdet er samlet',
}
function getMicrocopy(total: number, isSignedUp: boolean): string {
  const needed = THRESHOLD - total
  if (total >= THRESHOLD) return isSignedUp ? 'Du er med. Så er der træning!' : 'Så er der træning!'
  if (isSignedUp) {
    if (needed === 1) return 'Vi mangler én mere – ring til nogen!'
    if (total >= 6)   return `${needed} mere så spiller vi!`
    return `Godkendt – men ${needed} mangler stadig`
  }
  if (total === 0) return 'Nogen der gider møde op?'
  if (needed === 1) return '1 mere så spiller vi – det er dig!'
  if (total >= 6)   return `${needed} mere. Vi er næsten der.`
  return 'Meld dig ind og red træningen'
}
function buildSocialLabel(attendance: string[], players: Player[], myId: string): string {
  if (attendance.length === 0) return ''
  const sorted = [...attendance].sort((a) => (a === myId ? -1 : 1))
  const first = (id: string) => players.find((p) => p.id === id)?.name.split(' ')[0] ?? 'Ukendt'
  const n = sorted.length
  if (n === 1) return `${first(sorted[0])} tilmeldt`
  if (n === 2) return `${first(sorted[0])} og ${first(sorted[1])} tilmeldt`
  if (n === 3) return `${first(sorted[0])}, ${first(sorted[1])} og ${first(sorted[2])} tilmeldt`
  return `${first(sorted[0])}, ${first(sorted[1])} og ${n - 2} andre tilmeldt`
}
function daysUntil(dateStr: string): number {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(new Date())
  const [ty, tm, td] = today.split('-').map(Number)
  const [gy, gm, gd] = dateStr.split('-').map(Number)
  return Math.round((Date.UTC(gy, gm - 1, gd) - Date.UTC(ty, tm - 1, td)) / 86_400_000)
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })

export default function Home() {
  const navigate = useNavigate()
  const matches       = useMatchStore((s) => s.matches)
  const players       = usePlayerStore((s) => s.players)
  const getPlayerStats = useMatchStore((s) => s.getPlayerStats)
  const isAdmin       = useAuthStore((s) => s.isAdmin)
  const { preference, setPreference } = useThemeStore()
  const trainings     = useTrainingStore((s) => s.trainings)

  const completedMatches = matches.filter((m) => m.isCompleted)
  const realCompleted    = completedMatches.filter((m) => !isOversidder(m))
  const upcomingMatches  = matches.filter((m) => !m.isCompleted && !isOversidder(m))
  const recentMatches    = realCompleted.slice(0, 3)
  const formMatches      = realCompleted.slice(0, 5)

  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(new Date())
  const nextRealMatch = upcomingMatches.find((m) => m.date.slice(0, 10) >= today) ?? upcomingMatches[0] ?? null
  const nextTraining  = [...trainings]
    .filter((t) => !t.cancelled && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null

  const showTrainingCard =
    !nextRealMatch ||
    (nextTraining !== null && nextTraining.date < nextRealMatch.date.slice(0, 10))

  const wins       = realCompleted.filter((m) => m.scoreUs > m.scoreThem).length
  const draws      = realCompleted.filter((m) => m.scoreUs === m.scoreThem).length
  const losses     = realCompleted.filter((m) => m.scoreUs < m.scoreThem).length
  const totalGoals = realCompleted.reduce((sum, m) => sum + m.scoreUs, 0)

  const playerStats = players.map((p) => ({ player: p, ...getPlayerStats(p.id) }))
  const topScorer   = [...playerStats].sort((a, b) => b.goals   - a.goals)[0]
  const topAssister = [...playerStats].sort((a, b) => b.assists - a.assists)[0]

  return (
    <div className="pb-8">

      {/* ── Club hero ──────────────────────────────────────── */}
      <div className="relative px-4 pt-8 pb-7 overflow-hidden">
        <div
          className="absolute -top-6 right-0 w-56 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)' }}
        />

        <div className="flex items-start justify-between relative">
          <div>
            <PageHeader label={SEASON_LABEL} title={CLUB_NAME} />
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {players.length} spillere i truppen
            </p>
          </div>

          {/* Right: crest (long-press for admin) + theme toggle */}
          <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
            <ClubCrest size={52} />
            <button
              onClick={() => setPreference(preference === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center w-6 h-6 rounded-full active:scale-90 transition-transform"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              aria-label="Skift tema"
            >
              {preference === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── 1. Next activity (match or training) ──────────── */}
        {!showTrainingCard && nextRealMatch && (
          <div>
            <SectionLabel>Næste kamp</SectionLabel>
            <button
              onClick={() => navigate(`/kampe/${nextRealMatch.id}`)}
              className="w-full rounded-2xl p-4 md:p-6 text-left active:scale-[0.97] transition-all duration-150 relative overflow-hidden cursor-pointer"
              style={{
                background: `linear-gradient(135deg, var(--accent-card-tint) 0%, var(--bg-card) 60%)`,
                border:     '1px solid var(--accent-card-border)',
                boxShadow:  '0 2px 12px rgba(0,0,0,0.12)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow    = '0 6px 24px rgba(220,38,38,0.14), 0 2px 8px rgba(0,0,0,0.15)'
                e.currentTarget.style.borderColor  = 'rgba(220,38,38,0.38)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow    = '0 2px 12px rgba(0,0,0,0.12)'
                e.currentTarget.style.borderColor  = 'var(--accent-card-border)'
              }}
            >
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
                   style={{ background: 'var(--accent-stripe)' }} />
              <div className="pl-3">
                <NextMatchLineup match={nextRealMatch} allPlayers={players} />
              </div>
            </button>
          </div>
        )}

        {showTrainingCard && nextTraining && (
          <NextTrainingCard training={nextTraining} />
        )}

        {/* ── 2. Season narrative ───────────────────────────── */}
        {realCompleted.length > 0 && (
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
                {realCompleted.length} {realCompleted.length === 1 ? 'kamp' : 'kampe'}
              </span>{' '}
              spillet —{' '}
              <span className="font-semibold text-green-400">{wins} {wins === 1 ? 'sejr' : 'sejre'}</span>
              {draws > 0 && <>, <span className="font-semibold text-yellow-400">{draws} uafgjort{draws !== 1 ? 'e' : ''}</span></>}
              {losses > 0 && <>, <span className="font-semibold" style={{ color: 'var(--color-loss)' }}>{losses} {losses === 1 ? 'nederlag' : 'nederlage'}</span></>}
              {' og '}
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>{totalGoals} mål scored</span>.
            </p>
          </div>
        )}

        {/* ── 3. Form strip ─────────────────────────────────── */}
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
                    <button
                      key={m.id}
                      onClick={() => navigate(`/kampe/${m.id}`)}
                      title={`${won ? 'Sejr' : draw ? 'Uafgjort' : 'Nederlag'} · ${m.scoreUs}–${m.scoreThem} vs. ${m.opponent}`}
                      className="w-6 h-6 rounded-full shrink-0 active:scale-90 transition-transform cursor-pointer"
                      style={{
                        background: won ? 'rgba(74,222,128,0.20)' : draw ? 'rgba(250,204,21,0.20)' : 'rgba(252,138,74,0.20)',
                        border:     `1.5px solid ${won ? 'var(--color-win)' : draw ? 'var(--color-draw)' : 'var(--color-loss)'}`,
                        boxShadow:  `0 0 6px ${won ? 'rgba(74,222,128,0.18)' : draw ? 'rgba(250,204,21,0.18)' : 'rgba(252,138,74,0.18)'}`,
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

        {/* ── 4. Top scorer + top assister ──────────────────── */}
        <div>
          <SectionLabel>Sæsonens bedste</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {/* Top scorer */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: 'var(--icon-accent-bg)', color: 'var(--accent)' }}>
                <Flame size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--text-muted)' }}>Topscorer</p>
                <p className="font-semibold text-sm truncate leading-tight"
                   style={{ color: 'var(--text-primary)' }}>
                  {topScorer ? topScorer.player.name.split(' ')[0] : '—'}
                </p>
                <p className="text-[10px] truncate leading-tight"
                   style={{ color: 'var(--text-faint)' }}>
                  {topScorer ? topScorer.player.name.split(' ').slice(1).join(' ') : ''}
                </p>
              </div>
              <p className="font-display text-4xl leading-none" style={{ color: 'var(--text-primary)' }}>
                {topScorer?.goals ?? 0}
                <span className="text-[11px] font-semibold ml-1" style={{ color: 'var(--accent)', fontFamily: 'inherit' }}>mål</span>
              </p>
            </div>

            {/* Top assister */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: 'var(--icon-accent-bg)', color: 'var(--accent)' }}>
                <Share2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--text-muted)' }}>Flest assists</p>
                <p className="font-semibold text-sm truncate leading-tight"
                   style={{ color: 'var(--text-primary)' }}>
                  {topAssister ? topAssister.player.name.split(' ')[0] : '—'}
                </p>
                <p className="text-[10px] truncate leading-tight"
                   style={{ color: 'var(--text-faint)' }}>
                  {topAssister ? topAssister.player.name.split(' ').slice(1).join(' ') : ''}
                </p>
              </div>
              <p className="font-display text-4xl leading-none" style={{ color: 'var(--text-primary)' }}>
                {topAssister?.assists ?? 0}
                <span className="text-[11px] font-semibold ml-1" style={{ color: 'var(--accent)', fontFamily: 'inherit' }}>ast</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 5. Recent results ─────────────────────────────── */}
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

        {/* ── 6. Admin CTA ──────────────────────────────────── */}
        {isAdmin && (
          <button
            onClick={() => navigate('/kampe/ny')}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm active:scale-[0.97] transition-transform"
            style={{
              background: 'var(--cta-bg)',
              color:      'var(--cta-color)',
              boxShadow:  '0 8px 24px var(--cta-shadow)',
            }}
          >
            <Plus size={20} strokeWidth={2.5} />
            Opret ny kamp
          </button>
        )}

        {/* ── 7. Non-admin member CTA ───────────────────────── */}
        {!isAdmin && upcomingMatches.length > 0 && (
          <button
            onClick={() => navigate(`/kampe/${upcomingMatches[0].id}`)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm active:scale-[0.97] transition-transform"
            style={{
              background: 'var(--bg-card)',
              color:      'var(--text-secondary)',
              border:     '1px solid var(--border)',
            }}
          >
            Er du med til næste kamp? →
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
  const players      = usePlayerStore((s) => s.players)
  const signUp       = useTrainingStore((s) => s.signUp)
  const cancelSignUp = useTrainingStore((s) => s.cancelSignUp)

  const [myPlayerId, setMyPlayerId] = useState<string>(() => localStorage.getItem('spartak_my_player_id') ?? '')
  const [showPicker, setShowPicker] = useState(false)

  const attendance = training.attendance ?? []
  const total      = attendance.length
  const isSignedUp = myPlayerId !== '' && attendance.includes(myPlayerId)
  const state      = attState(total)
  const color      = STATE_COLOR[state]
  const pct        = Math.min(100, Math.round((total / THRESHOLD) * 100))
  const days       = daysUntil(training.date)

  const dateLabel = new Date(training.date + 'T12:00:00').toLocaleDateString('da-DK', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const AVATAR_MAX = 5
  const avatarIds  = attendance.slice(0, AVATAR_MAX)
  const overflow   = attendance.length - AVATAR_MAX

  const selectAndSignUp = (pid: string) => {
    setMyPlayerId(pid)
    localStorage.setItem('spartak_my_player_id', pid)
    setShowPicker(false)
    signUp(training.id, pid)
  }

  const handleSignUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!myPlayerId) { setShowPicker(true); return }
    if (isSignedUp) cancelSignUp(training.id, myPlayerId)
    else signUp(training.id, myPlayerId)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-card-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--accent)' }}>
            Næste træning
          </span>
          {days >= 0 && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
              <Clock size={10} />
              Svarfrist om {days} {days === 1 ? 'dag' : 'dage'}
            </span>
          )}
        </div>
        <p className="font-bold text-lg capitalize mt-2" style={{ color: 'var(--text-primary)' }}>
          {dateLabel}
        </p>
        <div className="flex items-center gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Clock size={11} strokeWidth={2} />{training.time}
          </span>
          <span className="flex items-center gap-1.5 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            <MapPin size={11} strokeWidth={2} />{training.location}
          </span>
        </div>
      </div>

      {/* Attendance bar */}
      <div className="mx-4 mb-3 rounded-xl px-3 py-2.5"
           style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold" style={{ color }}>{STATE_LABEL[state]}</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {total} / {THRESHOLD}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
          {getMicrocopy(total, isSignedUp)}
        </p>
      </div>

      {/* Inline player picker */}
      {showPicker && (
        <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--border-faint)' }}>
          <p className="text-xs font-semibold mt-3 mb-2" style={{ color: 'var(--text-secondary)' }}>
            Hvem er du?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <button
                key={p.id}
                onClick={() => selectAndSignUp(p.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPicker(false)}
            className="mt-2 text-[11px]"
            style={{ color: 'var(--text-faint)' }}
          >
            Annuller
          </button>
        </div>
      )}

      {/* Social row + CTA */}
      {!showPicker && (
        <button
          onClick={handleSignUp}
          className="w-full flex items-center gap-2.5 px-4 py-3 active:opacity-75 transition-opacity"
          style={{ borderTop: '1px solid var(--border-faint)', background: isSignedUp ? 'rgba(74,222,128,0.06)' : undefined }}
        >
          {/* Avatars */}
          {attendance.length > 0 && (
            <div className="flex -space-x-1.5 shrink-0">
              {avatarIds.map((id) => {
                const p = players.find((pl) => pl.id === id)
                return p ? (
                  <div key={id} className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                       style={{ outline: '2px solid var(--bg-card)' }}>
                    <PlayerAvatar name={p.name} size="sm" />
                  </div>
                ) : null
              })}
              {overflow > 0 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                     style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  +{overflow}
                </div>
              )}
            </div>
          )}

          <p className="flex-1 text-xs text-left truncate" style={{ color: 'var(--text-secondary)' }}>
            {attendance.length === 0
              ? 'Vær den første til at tilmelde dig'
              : buildSocialLabel(attendance, players, myPlayerId)}
          </p>

          {isSignedUp ? (
            <span className="flex items-center gap-1 text-[11px] font-bold shrink-0" style={{ color: '#4ade80' }}>
              <CheckCircle2 size={13} /> Tilmeldt
            </span>
          ) : (
            <span className="text-[11px] font-bold shrink-0 px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--cta-bg)', color: 'var(--cta-color)' }}>
              Tilmeld mig
            </span>
          )}
        </button>
      )}
    </div>
  )
}
