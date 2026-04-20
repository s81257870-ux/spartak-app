import { useState } from 'react'
import { CheckCircle2, Minus, Plus } from 'lucide-react'
import type { Match } from '../../types'
import { CLUB_NAME } from '../../data/leagueTable'

interface Props {
  match: Match
  /** Called with the final score the admin confirmed. */
  onConfirm: (scoreUs: number, scoreThem: number) => void
  onCancel: () => void
}

export default function CompleteMatchSheet({ match, onConfirm, onCancel }: Props) {
  // Admin can edit the score before confirming — useful for W.O. and quick fixes.
  const [scoreUs,   setScoreUs]   = useState(match.scoreUs)
  const [scoreThem, setScoreThem] = useState(match.scoreThem)

  const won   = scoreUs > scoreThem
  const draw  = scoreUs === scoreThem
  const resultColor = won ? '#4ade80' : draw ? '#facc15' : 'var(--color-loss)'
  const resultLabel = won ? 'Sejr' : draw ? 'Uafgjort' : 'Nederlag'

  const clamp = (n: number) => Math.max(0, n)

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

        {/* Header */}
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
              Juster resultatet og bekræft
            </p>
          </div>
        </div>

        {/* Score editor */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-center mb-4"
             style={{ color: 'var(--text-muted)' }}>
            Sæt resultatet
          </p>

          <div className="flex items-center justify-center gap-3">

            {/* Spartak score */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-semibold text-center w-20 truncate"
                 style={{ color: 'var(--text-muted)' }}>
                {CLUB_NAME}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScoreUs(clamp(scoreUs - 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                >
                  <Minus size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <span
                  className="font-display text-5xl leading-none tabular-nums w-12 text-center"
                  style={{ color: won ? '#4ade80' : 'var(--text-primary)' }}
                >
                  {scoreUs}
                </span>
                <button
                  onClick={() => setScoreUs(scoreUs + 1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                >
                  <Plus size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            {/* Dash */}
            <span className="text-2xl font-bold pb-1" style={{ color: 'var(--text-dimmer)' }}>–</span>

            {/* Opponent score */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-semibold text-center w-20 truncate"
                 style={{ color: 'var(--text-muted)' }}>
                {match.opponent}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScoreThem(clamp(scoreThem - 1))}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                >
                  <Minus size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
                <span
                  className="font-display text-5xl leading-none tabular-nums w-12 text-center"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {scoreThem}
                </span>
                <button
                  onClick={() => setScoreThem(scoreThem + 1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
                >
                  <Plus size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Result badge + W.O. shortcut */}
          <div className="flex items-center justify-between mt-4">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                color:      resultColor,
                background: `${resultColor === 'var(--color-loss)' ? 'rgba(252,138,74' : resultColor.replace(')', '')}18)`,
                border:     `1px solid ${resultColor === 'var(--color-loss)' ? 'rgba(252,138,74,0.40)' : `${resultColor.replace(')', '')}40)`}`,
              }}
            >
              {resultLabel}
            </span>

            {/* W.O. quick-set */}
            <button
              onClick={() => { setScoreUs(3); setScoreThem(0) }}
              className="text-[11px] font-bold px-3 py-1 rounded-full active:scale-95 transition-transform"
              style={{
                background: 'var(--bg-raised)',
                color:      'var(--text-muted)',
                border:     '1px solid var(--border)',
              }}
            >
              W.O. (3–0)
            </button>
          </div>
        </div>

        <button
          onClick={() => onConfirm(scoreUs, scoreThem)}
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
