/**
 * Training is every Monday at 19:30.
 *
 * nextTrainingDateKey() returns the date string "YYYY-MM-DD" for the next
 * upcoming training session:
 *   • If today IS Monday and it is before 20:00  → today
 *   • Otherwise                                  → the coming Monday
 *
 * Using local date arithmetic (no UTC) to avoid midnight-shift issues on
 * Danish devices (same technique as the match date formatters).
 */
export function nextTrainingDateKey(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sun, 1 = Mon, … , 6 = Sat

  let daysUntil: number
  if (day === 1 && now.getHours() < 20) {
    daysUntil = 0                 // today's session is still upcoming
  } else if (day === 1) {
    daysUntil = 7                 // Monday but session is over — skip to next week
  } else {
    // (8 - day) % 7 gives days-until-Monday for Sun(1), Tue(6), Wed(5) …
    daysUntil = (8 - day) % 7
  }

  const target = new Date(now)
  target.setDate(now.getDate() + daysUntil)

  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Formats "2026-03-23" → "mandag 23. mar."
 * Uses local Date constructor to avoid UTC weekday shift.
 */
export function formatTrainingDate(dateKey: string): string {
  const [y, mo, d] = dateKey.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  return date.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}
