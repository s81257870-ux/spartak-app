import type { MatchEvent, Player } from '../types'

export interface ScorerSummary {
  name: string
  count: number
  /** First-names of assisters, one entry per goal that had an assist. */
  assists: string[]
}

/**
 * Groups our own goals by scorer, accumulating assists per player.
 * Returns entries in the order the first goal was scored.
 */
export function groupGoalScorers(events: MatchEvent[], players: Player[]): ScorerSummary[] {
  const goals = events.filter((e) => e.type === 'goal' && e.team === 'us' && e.scorerId)

  const order: string[] = []
  const map = new Map<string, { count: number; assists: string[] }>()

  for (const g of goals) {
    if (!map.has(g.scorerId)) {
      order.push(g.scorerId)
      map.set(g.scorerId, { count: 0, assists: [] })
    }
    const entry = map.get(g.scorerId)!
    entry.count++
    if (g.assistId) {
      const assister = players.find((p) => p.id === g.assistId)
      if (assister) entry.assists.push(assister.name.split(' ')[0])
    }
  }

  return order.map((pid) => {
    const entry  = map.get(pid)!
    const player = players.find((p) => p.id === pid)
    return {
      name:    player ? player.name.split(' ')[0] : 'Ukendt',
      count:   entry.count,
      assists: entry.assists,
    }
  })
}
