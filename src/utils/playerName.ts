import type { Player } from '../types'

/**
 * Returns a short display name for a player.
 * If the first name is unique in the squad, returns just the first name.
 * If duplicated, appends enough letters of the last name to distinguish.
 *
 * Examples with the current squad:
 *   Frederik Overgaard Kiilerich → "Frederik Ki."
 *   Frederik Valdemar Kjeldgaard → "Frederik Kj."
 *   Mathias Hermann Bloch        → "Mathias B."
 *   Mathias Hp                   → "Mathias H."
 *   Rasmus Beyer                 → "Rasmus B."
 *   Rasmus Tue Nielsen           → "Rasmus N."
 */
export function displayName(player: Player, allPlayers: Player[]): string {
  const parts = player.name.split(' ')
  const firstName = parts[0]
  const conflicts = allPlayers.filter(
    (p) => p.id !== player.id && p.name.split(' ')[0] === firstName
  )
  if (conflicts.length === 0) return firstName

  const lastName = parts[parts.length - 1]
  const conflictLastNames = conflicts.map((p) => {
    const cp = p.name.split(' ')
    return cp[cp.length - 1]
  })

  // Find minimum prefix of this player's last name that differs from all conflicts
  for (let len = 1; len <= lastName.length; len++) {
    const prefix = lastName.slice(0, len)
    if (!conflictLastNames.some((n) => n.slice(0, len).toLowerCase() === prefix.toLowerCase())) {
      return `${firstName} ${prefix}.`
    }
  }

  // Fallback: full last name
  return `${firstName} ${lastName}`
}

/**
 * Returns initials for avatar (max 2 chars).
 */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/**
 * Returns a chip label for pitch/bench display: last name first.
 * If another player shares the same last name, appends first-name initial.
 *
 * Examples:
 *   "Rasmus Beyer"              → "Beyer"
 *   "Mathias Hermann Bloch"     → "Bloch M."   (if another Bloch exists)
 */
export function chipLabel(player: Player, allPlayers: Player[]): string {
  const parts = player.name.trim().split(' ')
  const lastName  = parts[parts.length - 1]
  const firstName = parts[0]

  const hasDuplicate = allPlayers.some(
    (p) => p.id !== player.id && p.name.trim().split(' ').pop() === lastName
  )

  return hasDuplicate ? `${lastName} ${firstName[0]}.` : lastName
}
