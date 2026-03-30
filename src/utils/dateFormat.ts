/**
 * Shared Danish date formatters.
 * All functions take an ISO string (YYYY-MM-DDTHH:MM or YYYY-MM-DD).
 * Timezone-safe: date part is parsed explicitly so no UTC-shift occurs.
 */

/**
 * "Tirsdag 7. april · 20:30"  — long weekday + day + long month + optional time.
 * When iso has no time component (YYYY-MM-DD), returns "Mandag 23. marts".
 */
export function fmtLong(iso: string): string {
  const [datePart, timePart] = iso.split('T')
  const [y, m, d]  = datePart.split('-').map(Number)
  const date       = new Date(y, m - 1, d)
  const weekday    = date.toLocaleDateString('da-DK', { weekday: 'long' })
  const dayMonth   = date.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })
  const cap        = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const time       = timePart?.slice(0, 5) ?? ''
  return time ? `${cap} ${dayMonth} · ${time}` : `${cap} ${dayMonth}`
}

/** "Lør 21. mar · 19:30" — short weekday + day + short month + optional time. */
export function fmtShortWithTime(iso: string): string {
  const [datePart, timePart] = iso.split('T')
  const [y, m, d]  = datePart.split('-').map(Number)
  const date       = new Date(y, m - 1, d)
  const weekday    = date.toLocaleDateString('da-DK', { weekday: 'short' })
  const dayMonth   = date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  const time       = timePart?.slice(0, 5) ?? ''
  return time ? `${weekday} ${dayMonth} · ${time}` : `${weekday} ${dayMonth}`
}

/** "Lør 21/03 · 19:30" — capitalised short weekday + d/m slash + optional time. */
export function fmtSlashWithTime(iso: string): string {
  const [datePart, timePart] = iso.split('T')
  const [y, m, d]  = datePart.split('-').map(Number)
  const date       = new Date(y, m - 1, d)
  const weekday    = date.toLocaleDateString('da-DK', { weekday: 'short' })
  const cap        = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const dd         = String(d).padStart(2, '0')
  const mm         = String(m).padStart(2, '0')
  const time       = timePart?.slice(0, 5) ?? ''
  return time ? `${cap} ${dd}/${mm} · ${time}` : `${cap} ${dd}/${mm}`
}

/** "21. mar. 2026" — day + short month + year, no weekday. */
export function fmtDayMonthYear(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** "Lør 21-03-2026 · 19:30" — Matches list format with DD-MM-YYYY + optional time. */
export function fmtMatchList(iso: string): string {
  const [datePart, timePart] = iso.split('T')
  const [y, m, d] = datePart.split('-')
  const date      = new Date(Number(y), Number(m) - 1, Number(d))
  const weekday   = date.toLocaleDateString('da-DK', { weekday: 'short' })
  const cap       = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const time      = timePart?.slice(0, 5) ?? ''
  const base      = `${cap} ${d}-${m}-${y}`
  return time ? `${base} · ${time}` : base
}
