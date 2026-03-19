/**
 * useRealtimeMatch
 * Subscribes to live Supabase updates for a specific match.
 * Should be used by MatchDetail — syncs store automatically.
 */
import { useEffect } from 'react'
import {
  subscribeMatchEvents,
  subscribeMatchLineup,
  subscribeMatchRow,
} from '../lib/supabaseService'
import { useMatchStore } from '../store/matchStore'
import type { Match, MatchEvent } from '../types'

export function useRealtimeMatch(matchId: string) {
  const setMatchEvents  = useMatchStore((s) => s.setMatchEvents)
  const setMatchLineup  = useMatchStore((s) => s.setMatchLineup)
  const applyMatchPatch = useMatchStore((s) => s.applyMatchPatch)

  useEffect(() => {
    const eventsChannel  = subscribeMatchEvents(matchId, (events: MatchEvent[]) => {
      setMatchEvents(matchId, events)
    })

    const lineupChannel  = subscribeMatchLineup(matchId, (lineup, bench) => {
      setMatchLineup(matchId, lineup, bench)
    })

    const matchChannel   = subscribeMatchRow(matchId, (updates: Partial<Match>) => {
      applyMatchPatch(matchId, updates)
    })

    return () => {
      eventsChannel.unsubscribe()
      lineupChannel.unsubscribe()
      matchChannel.unsubscribe()
    }
  }, [matchId, setMatchEvents, setMatchLineup, applyMatchPatch])
}
