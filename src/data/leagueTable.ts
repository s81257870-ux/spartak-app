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

export const CLUB_NAME   = 'Spartak Ciervo'
export const LEAGUE_NAME = 'Herre Senior 5 7:7 Forår – Dommerløs, P4'

/**
 * Real league table data – update manually each round.
 * Current state: season not yet started (all zeros).
 */
export const LEAGUE_TABLE: LeagueRow[] = [
  { position: 1, team: 'B 1903 4',            played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 2, team: 'Bispebjerg',           played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 3, team: 'FB 24',                played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 4, team: 'FC Ryparken 7',        played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 5, team: 'FC Ryparken 8',        played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 6, team: 'Olympiakos København', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 7, team: 'Skjold 21',            played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { position: 8, team: 'Spartak Ciervo',       played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, isSpartak: true },
]
