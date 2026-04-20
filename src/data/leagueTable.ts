export interface LeagueRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  isSpartak?: boolean
}

export const CLUB_NAME    = 'Spartak Ciervo'
export const LEAGUE_NAME  = 'Herre Senior 5 7:7 Forår – Dommerløs, P4'
export const SEASON_LABEL = 'Sæson 2026'

/**
 * Real league table data – update manually each round.
 * Last updated: 2026-04-20 (round 3 — Skjold 21 W.O. vs Spartak Ciervo)
 */
export const LEAGUE_TABLE: LeagueRow[] = [
  { position: 1, team: 'Olympiakos København', played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 13, goalsAgainst:  3, points: 6 },
  { position: 2, team: 'FB 24',                played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 13, goalsAgainst:  5, points: 6 },
  { position: 3, team: 'B 1903 4',             played: 2, won: 2, drawn: 0, lost: 0, goalsFor:  8, goalsAgainst:  3, points: 6 },
  { position: 4, team: 'Spartak Ciervo',       played: 2, won: 1, drawn: 0, lost: 1, goalsFor:  7, goalsAgainst:  6, points: 3, isSpartak: true },
  { position: 5, team: 'Bispebjerg',           played: 2, won: 0, drawn: 0, lost: 2, goalsFor:  5, goalsAgainst:  7, points: 0 },
  { position: 6, team: 'Skjold 21',            played: 1, won: 0, drawn: 0, lost: 1, goalsFor:  0, goalsAgainst:  3, points: 0 },
  { position: 7, team: 'FC Ryparken 7',        played: 1, won: 0, drawn: 0, lost: 1, goalsFor:  0, goalsAgainst:  4, points: 0 },
  { position: 8, team: 'Jægersborg 4',         played: 1, won: 0, drawn: 0, lost: 1, goalsFor:  1, goalsAgainst:  7, points: 0 },
  { position: 9, team: 'FC Ryparken 8',        played: 1, won: 0, drawn: 0, lost: 1, goalsFor:  1, goalsAgainst: 10, points: 0 },
]
