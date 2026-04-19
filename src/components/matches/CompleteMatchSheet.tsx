import { CheckCircle2 } from 'lucide-react'
import type { Match } from '../../types'
import { CLUB_NAME } from '../../data/leagueTable'

interface Props {
  match: Match
  onConfirm: () => void
  onCancel: () => void
}

export default function CompleteMatchSheet({ match, onConfirm, onCancel }: Props) {
  const won   = match.scoreUs > match.scoreThem
  const draw  = match.scoreUs === match.scoreThem
  const resultColor = won ? '#4ade80' : draw ? '#facc15' : 'var(--color-loss)'
  const resultLabel = won ? 'Sejr' : draw ? 'Uafgjort' : 'Nederlag'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-5 pb-10 space-y-5"
        style={{ background: 'var(--bg-raised)', maxWidth: 480 }}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border-input)' }} />

        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--icon-accent-bg)' }}
          >
            <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Afslut kamp</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Dette låser kampen og gemmer resultatet
            </p>
          </div>
        </div>

        {/* Score confirmation */}
        <div
          className="rounded-2xl px-5 py-4 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Bekræft resultatet
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{CLUB_NAME}</p>
            </div>
            <div
              className="font-display text-4xl font-black tabular-nums"
              style={{ color: resultColor, fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {match.scoreUs}–{match.scoreThem}
            </div>
            <div className="text-center">
              <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{match.opponent}</p>
            </div>
          </div>
          <span
            className="inline-block mt-3 text-xs font-bold px-3 py-1 rounded-full"
            style={{
              color:      resultColor,
              background: `${resultColor === 'var(--color-loss)' ? 'rgba(252,138,74' : resultColor.replace(')', '')}18)`,
              border:     `1px solid ${resultColor === 'var(--color-loss)' ? 'rgba(252,138,74,0.40)' : `${resultColor.replace(')', '')}40)`}`,
            }}
          >
            {resultLabel}
          </span>
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform"
          style={{
            background: 'var(--cta-bg)',
            color:      'var(--cta-color)',
            boxShadow:  '0 6px 20px var(--cta-shadow)',
          }}
        >
          Ja, afslut kampen
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl font-semibold text-sm"
          style={{
            background: 'var(--bg-card)',
            color:      'var(--text-secondary)',
            border:     '1px solid var(--border)',
          }}
        >
          Annuller
        </button>
      </div>
    </div>
  )
}
