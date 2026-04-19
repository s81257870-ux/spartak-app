/**
 * MobilePaySheet — guides a player through paying their outstanding fines
 * via MobilePay box 6091RS ("Spartak Ciervo bødekassen").
 *
 * Flow:
 *  1. Shows the unpaid amount + fine count
 *  2. Displays box name & ID with a one-tap copy button
 *  3. Step-by-step guide (4 steps)
 *  4. "Åbn MobilePay" — tries the app deep link, falls back to store URL
 *  5. "Jeg har betalt" — marks all shown fines as paid, then closes
 */

import { useState } from 'react'
import { X, Copy, Check, ArrowUpRight } from 'lucide-react'

// ── MobilePay brand ────────────────────────────────────────────────────────────
export const MOBILEPAY_BOX_ID   = '6091RS'
export const MOBILEPAY_BOX_NAME = 'Spartak Ciervo bødekassen'

const MP  = '#5B4FE8'           // MobilePay purple
const MPa = 'rgba(91,79,232,'  // helper prefix for rgba

interface Props {
  /** Total unpaid amount in DKK for this player */
  amount:        number
  /** Number of unpaid fines */
  fineCount:     number
  onClose:       () => void
  /** Called when player confirms payment — caller marks fines as paid */
  onMarkAllPaid: () => void
}

export default function MobilePaySheet({ amount, fineCount, onClose, onMarkAllPaid }: Props) {
  const [copied,     setCopied]     = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(MOBILEPAY_BOX_ID).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  const handleOpenMobilePay = () => {
    // Try the native deep link first; if the app isn't installed nothing bad happens
    window.location.href = 'mobilepay://'
  }

  const handleConfirmPaid = () => {
    setConfirming(true)
    setTimeout(() => {
      onMarkAllPaid()
      onClose()
    }, 700)
  }

  const steps = [
    'Åbn MobilePay på din telefon',
    'Tryk på "Betal" og vælg "Boks"',
    `Søg på boks-nr. ${MOBILEPAY_BOX_ID}`,
    `Betal ${amount} kr og bekræft`,
  ]

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* ── Sheet ────────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl flex flex-col"
        style={{
          background:  'var(--bg-card)',
          boxShadow:   '0 -12px 48px rgba(0,0,0,0.40)',
          maxHeight:   '92svh',
          overflowY:   'auto',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="px-5 pt-3 pb-10 space-y-5">

          {/* ── Title row ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
              Betal din gæld
            </p>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
              style={{ background: 'var(--bg-raised)' }}
            >
              <X size={15} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* ── Amount hero — only when there's actual debt ─────────── */}
          {amount > 0 && (
            <div
              className="rounded-2xl py-5 text-center"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
                 style={{ color: 'var(--text-faint)' }}>
                Du skylder
              </p>
              <p className="font-black leading-none"
                 style={{ fontSize: 52, color: 'var(--amount-color)', lineHeight: 1 }}>
                {amount}
                <span
                  className="font-semibold ml-2"
                  style={{ fontSize: 22, color: 'var(--text-muted)' }}
                >
                  kr
                </span>
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
                {fineCount} ubetalt{fineCount !== 1 ? 'e' : ''} bøde{fineCount !== 1 ? 'r' : ''}
              </p>
            </div>
          )}

          {/* ── MobilePay box card ─────────────────────────────────────── */}
          <div
            className="rounded-2xl p-4 flex items-center justify-between gap-3"
            style={{
              background: `${MPa}0.09)`,
              border:     `1px solid ${MPa}0.20)`,
            }}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.10em] mb-0.5"
                 style={{ color: `${MPa}0.55)` }}>
                MobilePay Boks
              </p>
              <p className="text-sm font-semibold leading-snug truncate"
                 style={{ color: 'var(--text-primary)' }}>
                {MOBILEPAY_BOX_NAME}
              </p>
              <p className="font-black text-2xl mt-0.5 tracking-widest"
                 style={{ color: MP, letterSpacing: '0.08em' }}>
                {MOBILEPAY_BOX_ID}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
              style={{
                background: copied ? 'rgba(74,222,128,0.12)' : `${MPa}0.14)`,
                color:      copied ? '#4ade80' : MP,
                border:     `1px solid ${copied ? 'rgba(74,222,128,0.28)' : `${MPa}0.25)`}`,
              }}
            >
              {copied
                ? <><Check size={13} /> Kopieret</>
                : <><Copy size={13} /> Kopiér</>}
            </button>
          </div>

          {/* ── Step-by-step ───────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
               style={{ color: 'var(--text-faint)' }}>
              Sådan betaler du
            </p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: `${MPa}0.14)`,
                    color:       MP,
                    fontSize:    11,
                    fontWeight:  800,
                  }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* ── Open MobilePay CTA ─────────────────────────────────────── */}
          <button
            onClick={handleOpenMobilePay}
            className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={{
              background: `linear-gradient(135deg, ${MP} 0%, #7B6FE8 100%)`,
              color:       '#fff',
              boxShadow:   `0 8px 28px ${MPa}0.38)`,
            }}
          >
            Åbn MobilePay
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </button>

          {/* ── Mark as paid — only when there's debt to clear ────────── */}
          {amount > 0 && (
            <button
              onClick={handleConfirmPaid}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:opacity-70 transition-all"
              style={{
                background: confirming ? 'rgba(74,222,128,0.10)' : 'var(--bg-raised)',
                color:      confirming ? '#4ade80' : 'var(--text-muted)',
                border:     `1px solid ${confirming ? 'rgba(74,222,128,0.25)' : 'var(--border)'}`,
                transition: 'background 300ms, color 300ms, border-color 300ms',
              }}
            >
              {confirming
                ? <><Check size={15} /> Markeret som betalt!</>
                : 'Jeg har betalt — marker som betalt'}
            </button>
          )}

        </div>
      </div>
    </>
  )
}
