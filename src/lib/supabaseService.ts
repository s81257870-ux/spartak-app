/**
 * supabaseService.ts
 * All Supabase database operations for the Spartak app.
 * Returns domain types (Player, Match, MatchEvent) directly.
 */
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Match, MatchEvent, Player, Position } from '../types'
import { DEFAULT_FORMATION } from '../data/formations'

// ── Raw DB row shapes ─────────────────────────────────────────────────────────

interface DbPlayer {
  id: string
  name: string
  number: number | null
  position: string | null
}

interface DbMatch {
  id: string
  opponent: string
  match_date: string
  location: string
  score_us: number | null
  score_them: number | null
  is_completed: boolean | null
  formation: string | null
  man_of_the_match: string | null
  signed_up: string[] | null
  starters: string[] | null
  events?: DbEvent[]
}

interface DbEvent {
  id: string
  match_id: string
  player_id: string | null
  assist_player_id: string | null
  type: string
  team: string | null
}

interface DbLineupSlot {
  id: string
  match_id: string
  player_id: string
  position: string | null
  slot_type: string
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapPlayer(row: DbPlayer): Player {
  return {
    id: row.id,
    name: row.name,
    number: row.number ?? undefined,
    position: (row.position as Position) ?? 'CM',
  }
}

function mapEvent(row: DbEvent): MatchEvent {
  return {
    id: row.id,
    type: row.type as MatchEvent['type'],
    scorerId: row.player_id ?? '',
    assistId: row.assist_player_id ?? undefined,
    team: (row.team === 'them' ? 'them' : 'us') as 'us' | 'them',
  }
}

function mapMatch(row: DbMatch, slots: DbLineupSlot[], events: DbEvent[]): Match {
  const lineup: Record<string, string> = {}
  const bench: string[] = []

  for (const slot of slots) {
    if (slot.slot_type === 'starter' && slot.position) {
      lineup[slot.position] = slot.player_id
    } else if (slot.slot_type === 'bench') {
      bench.push(slot.player_id)
    }
  }

  return {
    id: row.id,
    opponent: row.opponent,
    date: row.match_date ?? '',
    location: row.location,
    scoreUs: row.score_us ?? 0,
    scoreThem: row.score_them ?? 0,
    isCompleted: row.is_completed ?? false,
    formation: row.formation ?? DEFAULT_FORMATION,
    manOfTheMatch: row.man_of_the_match ?? undefined,
    attendance: row.signed_up ?? [],
    starters:   row.starters   ?? [],
    events: events.map(mapEvent),
    lineup,
    bench,
  }
}

// ── Players ───────────────────────────────────────────────────────────────────

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name')
  if (error) throw error
  return (data as DbPlayer[]).map(mapPlayer)
}

export async function insertPlayer(player: Omit<Player, 'id'>): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ name: player.name, number: player.number ?? null, position: player.position })
    .select()
    .single()
  if (error) throw error
  return mapPlayer(data as DbPlayer)
}

export async function patchPlayer(id: string, updates: Partial<Omit<Player, 'id'>>): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({
      ...(updates.name      !== undefined && { name:     updates.name }),
      ...(updates.position  !== undefined && { position: updates.position }),
      ...(updates.number    !== undefined && { number:   updates.number ?? null }),
    })
    .eq('id', id)
  if (error) throw error
}

export async function removePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}

// ── Matches ───────────────────────────────────────────────────────────────────

export async function fetchAllMatches(): Promise<Match[]> {
  const [matchRes, eventsRes, slotsRes] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('events').select('*').order('created_at'),
    supabase.from('lineup_slots').select('*'),
  ])

  if (matchRes.error) throw matchRes.error

  const allEvents = (eventsRes.data ?? []) as DbEvent[]
  const allSlots  = (slotsRes.data  ?? []) as DbLineupSlot[]

  const eventsByMatch = allEvents.reduce<Record<string, DbEvent[]>>((acc, e) => {
    ;(acc[e.match_id] ??= []).push(e)
    return acc
  }, {})

  const slotsByMatch = allSlots.reduce<Record<string, DbLineupSlot[]>>((acc, s) => {
    ;(acc[s.match_id] ??= []).push(s)
    return acc
  }, {})

  return (matchRes.data as DbMatch[]).map((row) =>
    mapMatch(row, slotsByMatch[row.id] ?? [], eventsByMatch[row.id] ?? [])
  )
}

export async function insertMatch(
  match: Omit<Match, 'id' | 'events' | 'lineup' | 'bench' | 'attendance' | 'starters'>
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      opponent:         match.opponent,
      match_date:       match.date,
      location:         match.location,
      score_us:         match.scoreUs,
      score_them:       match.scoreThem,
      is_completed:     match.isCompleted,
      formation:        match.formation,
      man_of_the_match: match.manOfTheMatch ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapMatch(data as DbMatch, [], [])
}

export async function patchMatch(
  id: string,
  updates: Partial<Omit<Match, 'id' | 'events' | 'lineup' | 'bench'>>
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (updates.opponent      !== undefined) row.opponent         = updates.opponent
  if (updates.date          !== undefined) row.match_date       = updates.date
  if (updates.location      !== undefined) row.location         = updates.location
  if (updates.scoreUs       !== undefined) row.score_us         = updates.scoreUs
  if (updates.scoreThem     !== undefined) row.score_them       = updates.scoreThem
  if (updates.isCompleted   !== undefined) row.is_completed     = updates.isCompleted
  if (updates.formation     !== undefined) row.formation        = updates.formation
  if ('manOfTheMatch' in updates)          row.man_of_the_match = updates.manOfTheMatch ?? null
  if (updates.attendance    !== undefined) row.signed_up        = updates.attendance
  if (updates.starters      !== undefined) row.starters         = updates.starters

  const { error } = await supabase.from('matches').update(row).eq('id', id)
  if (error) throw error
}

export async function removeMatch(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) throw error
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function insertEvent(
  matchId: string,
  event: Omit<MatchEvent, 'id'>
): Promise<MatchEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      match_id:         matchId,
      player_id:        event.scorerId || null,
      assist_player_id: event.assistId ?? null,
      type:             event.type,
      team:             event.team ?? 'us',
    })
    .select()
    .single()
  if (error) throw error
  return mapEvent(data as DbEvent)
}

export async function patchEvent(
  eventId: string,
  updates: Partial<Omit<MatchEvent, 'id'>>
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (updates.type     !== undefined) row.type             = updates.type
  if (updates.scorerId !== undefined) row.player_id        = updates.scorerId || null
  if ('assistId' in updates)          row.assist_player_id = updates.assistId ?? null
  if (updates.team     !== undefined) row.team             = updates.team

  const { error } = await supabase.from('events').update(row).eq('id', eventId)
  if (error) throw error
}

// ── Score recalculation ───────────────────────────────────────────────────────

/**
 * Counts goal events for a match, writes score_us / score_them to matches table,
 * and returns the new scores so local state can be updated immediately.
 */
export async function recalculateMatchScore(
  matchId: string
): Promise<{ scoreUs: number; scoreThem: number }> {
  const { data, error } = await supabase
    .from('events')
    .select('team')
    .eq('match_id', matchId)
    .eq('type', 'goal')
  if (error) throw error

  const goals = (data ?? []) as { team: string | null }[]
  const scoreUs   = goals.filter((g) => g.team !== 'them').length
  const scoreThem = goals.filter((g) => g.team === 'them').length

  const { error: updateError } = await supabase
    .from('matches')
    .update({ score_us: scoreUs, score_them: scoreThem })
    .eq('id', matchId)
  if (updateError) throw updateError

  return { scoreUs, scoreThem }
}

export async function removeEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) throw error
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function signUpForMatch(matchId: string, playerId: string, current: string[]): Promise<void> {
  if (current.includes(playerId)) return
  const { error } = await supabase
    .from('matches')
    .update({ signed_up: [...current, playerId] })
    .eq('id', matchId)
  if (error) throw error
}

export async function cancelSignUpForMatch(matchId: string, playerId: string, current: string[]): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ signed_up: current.filter((id) => id !== playerId) })
    .eq('id', matchId)
  if (error) throw error
}

export async function addStarterForMatch(matchId: string, playerId: string, current: string[]): Promise<void> {
  if (current.includes(playerId)) return
  const { error } = await supabase
    .from('matches')
    .update({ starters: [...current, playerId] })
    .eq('id', matchId)
  if (error) throw error
}

export async function removeStarterForMatch(matchId: string, playerId: string, current: string[]): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ starters: current.filter((id) => id !== playerId) })
    .eq('id', matchId)
  if (error) throw error
}

// ── Lineup sync ───────────────────────────────────────────────────────────────

/**
 * Overwrites all lineup_slots for a match.
 * Called after every local lineup mutation.
 */
export async function syncLineup(
  matchId: string,
  lineup: Record<string, string>,
  bench: string[]
): Promise<void> {
  // Delete all existing slots for this match
  const { error: delError } = await supabase
    .from('lineup_slots')
    .delete()
    .eq('match_id', matchId)
  if (delError) throw delError

  const slots = [
    ...Object.entries(lineup).map(([position, playerId]) => ({
      match_id: matchId,
      player_id: playerId,
      position,
      slot_type: 'starter',
    })),
    ...bench.map((playerId) => ({
      match_id: matchId,
      player_id: playerId,
      position: null,
      slot_type: 'bench',
    })),
  ]

  if (slots.length > 0) {
    const { error } = await supabase.from('lineup_slots').insert(slots)
    if (error) throw error
  }
}

// ── Realtime ──────────────────────────────────────────────────────────────────

export function subscribeMatchEvents(
  matchId: string,
  onUpdate: (events: MatchEvent[]) => void
): RealtimeChannel {
  return supabase
    .channel(`events:match:${matchId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `match_id=eq.${matchId}` },
      async () => {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at')
        if (data) onUpdate((data as DbEvent[]).map(mapEvent))
      }
    )
    .subscribe()
}

export function subscribeMatchLineup(
  matchId: string,
  onUpdate: (lineup: Record<string, string>, bench: string[]) => void
): RealtimeChannel {
  return supabase
    .channel(`lineup:match:${matchId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lineup_slots', filter: `match_id=eq.${matchId}` },
      async () => {
        const { data } = await supabase
          .from('lineup_slots')
          .select('*')
          .eq('match_id', matchId)
        if (data) {
          const slots = data as DbLineupSlot[]
          const lineup: Record<string, string> = {}
          const bench: string[] = []
          for (const slot of slots) {
            if (slot.slot_type === 'starter' && slot.position) {
              lineup[slot.position] = slot.player_id
            } else if (slot.slot_type === 'bench') {
              bench.push(slot.player_id)
            }
          }
          onUpdate(lineup, bench)
        }
      }
    )
    .subscribe()
}

export function subscribeMatchRow(
  matchId: string,
  onUpdate: (updates: Partial<Match>) => void
): RealtimeChannel {
  return supabase
    .channel(`match:row:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      (payload) => {
        const row = payload.new as DbMatch
        onUpdate({
          scoreUs:        row.score_us        ?? 0,
          scoreThem:      row.score_them       ?? 0,
          isCompleted:    row.is_completed     ?? false,
          formation:      row.formation        ?? DEFAULT_FORMATION,
          manOfTheMatch:  row.man_of_the_match ?? undefined,
          attendance:     row.signed_up        ?? [],
          starters:       row.starters         ?? [],
        })
      }
    )
    .subscribe()
}
