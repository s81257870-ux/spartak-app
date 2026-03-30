export type Position =
  | 'MV'   // Målvogter
  | 'VB'   // Venstre back
  | 'CB'   // Midterback / stopper
  | 'HB'   // Højre back
  | 'VCB'  // Venstre centerback (4-back)
  | 'HCB'  // Højre centerback (4-back)
  | 'VM'   // Venstre midtbane
  | 'CM'   // Central midtbane
  | 'HM'   // Højre midtbane
  | 'VCM'  // Venstre central midt (4-mid)
  | 'HCM'  // Højre central midt (4-mid)
  | 'CMD'  // Defensiv central midt / ankermand
  | 'VA'   // Venstre angriber / wing
  | 'A'    // Central angriber
  | 'HA'   // Højre angriber / wing
  | 'SS'   // Skygge-angriber / second striker
  | 'UKE'  // Ukendt

export const POSITION_LABELS: Record<Position, string> = {
  MV:  'Målvogter',
  VB:  'Venstre back',
  CB:  'Midterback',
  HB:  'Højre back',
  VCB: 'Venstre centerback',
  HCB: 'Højre centerback',
  VM:  'Venstre midtbane',
  CM:  'Central midtbane',
  HM:  'Højre midtbane',
  VCM: 'Venstre central midt',
  HCM: 'Højre central midt',
  CMD: 'Defensiv midt / ankermand',
  VA:  'Venstre wing',
  A:   'Angriber',
  HA:  'Højre wing',
  SS:  'Skygge-angriber',
  UKE: 'Ukendt',
}

export interface Player {
  id: string
  name: string
  position: Position
  number?: number
}

export interface MatchEvent {
  id: string
  type: 'goal' | 'yellow-card' | 'red-card'
  scorerId: string   // for goal (us): scorer; for card: player; empty for opponent goals
  assistId?: string  // only used for our goals
  team?: 'us' | 'them'  // goal team — defaults to 'us'; only meaningful for type='goal'
}

export interface Match {
  id: string
  opponent: string
  date: string         // ISO date string
  location: string
  scoreUs: number
  scoreThem: number
  events: MatchEvent[]
  lineup: Record<string, string>   // Position key → playerId (starters)
  bench: string[]                  // playerIds on bench (admin-managed via lineup builder)
  attendance: string[]             // playerIds who signed up (player-managed)
  starters: string[]               // up to 7 playerIds chosen from attendance (admin-managed)
  formation: string                // e.g. '1-2-3-1'
  manOfTheMatch?: string           // playerId
  cleanSheet?: boolean
  isCompleted: boolean
}

export interface PlayerStats {
  playerId: string
  goals: number
  assists: number
  matchesPlayed: number
  cleanSheets: number
  yellowCards: number
  redCards: number
}

export interface TrainingGuest {
  id: string        // uuid
  addedBy: string   // playerId who brought the guest
  name?: string     // optional name, defaults to display as "Gæst"
}

export interface Training {
  id: string
  date: string       // 'YYYY-MM-DD'
  time: string       // 'HH:MM'
  location: string
  cancelled: boolean
  attendance: string[]      // playerIds
  guests:     TrainingGuest[]
}

export interface Fine {
  id: string
  playerId: string
  fineTypeId: string   // key from FINE_TYPES
  label: string        // snapshot of label at creation time
  amount: number
  date: string         // 'YYYY-MM-DD'
  note?: string
  paid: boolean
  matchId?: string     // optional linked match
}
