import type { Position } from '../types'

export interface FormationSlot {
  key: Position
  label: string
  /** row 1 = nearest opponent goal; last row = GK */
  row: number
  /** column 1-3 */
  col: number
}

export type FormationCategory =
  | 'Klassisk'
  | 'Offensiv'
  | 'Defensiv'
  | 'Special'

export interface Formation {
  id: string
  name: string
  description: string
  category: FormationCategory
  slots: FormationSlot[]
}

export const FORMATION_CATEGORIES: { id: FormationCategory; emoji: string }[] = [
  { id: 'Klassisk',  emoji: '⚽' },
  { id: 'Offensiv',  emoji: '⚔️' },
  { id: 'Defensiv',  emoji: '🛡️' },
  { id: 'Special',   emoji: '🧠' },
]

export const FORMATIONS: Formation[] = [
  // ─── Klassiske & balancerede ──────────────────────────────────────────────
  {
    id: '1-2-3-1',
    name: '1-2-3-1',
    description: 'mest brugte',
    category: 'Klassisk',
    slots: [
      { key: 'A',  label: 'Angriber',          row: 1, col: 2 },
      { key: 'VM', label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'CM', label: 'Central midtbane',  row: 2, col: 2 },
      { key: 'HM', label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'VB', label: 'Venstre back',      row: 3, col: 1 },
      { key: 'HB', label: 'Højre back',        row: 3, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-3-2-1',
    name: '1-3-2-1',
    description: 'defensiv stabil',
    category: 'Klassisk',
    slots: [
      { key: 'A',  label: 'Angriber',          row: 1, col: 2 },
      { key: 'VM', label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'HM', label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'VB', label: 'Venstre back',      row: 3, col: 1 },
      { key: 'CB', label: 'Midterback',        row: 3, col: 2 },
      { key: 'HB', label: 'Højre back',        row: 3, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-2-2-2',
    name: '1-2-2-2',
    description: 'god balance + 2 angribere',
    category: 'Klassisk',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'VM', label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'HM', label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'VB', label: 'Venstre back',      row: 3, col: 1 },
      { key: 'HB', label: 'Højre back',        row: 3, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-1-3-2',
    name: '1-1-3-2',
    description: 'midtbane-dominans',
    category: 'Klassisk',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'VM', label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'CM', label: 'Central midtbane',  row: 2, col: 2 },
      { key: 'HM', label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'CB', label: 'Stopper',           row: 3, col: 2 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },

  // ─── Offensive ────────────────────────────────────────────────────────────
  {
    id: '1-2-1-3',
    name: '1-2-1-3',
    description: 'meget pres fremad',
    category: 'Offensiv',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'A',  label: 'Central angriber',  row: 1, col: 2 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'CM', label: 'Central midtbane',  row: 2, col: 2 },
      { key: 'VB', label: 'Venstre back',      row: 3, col: 1 },
      { key: 'HB', label: 'Højre back',        row: 3, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-0-4-2',
    name: '1-0-4-2',
    description: 'ultra offensiv',
    category: 'Offensiv',
    // 2 wide forwards, 3-across midfield, 1 holding mid — 0 defenders
    slots: [
      { key: 'VA',  label: 'Venstre angriber',  row: 1, col: 1 },
      { key: 'HA',  label: 'Højre angriber',    row: 1, col: 3 },
      { key: 'VM',  label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'CM',  label: 'Central midtbane',  row: 2, col: 2 },
      { key: 'HM',  label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'CMD', label: 'Defensiv midt',     row: 3, col: 2 },
      { key: 'MV',  label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-1-2-3',
    name: '1-1-2-3',
    description: '3 angribere',
    category: 'Offensiv',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'A',  label: 'Central angriber',  row: 1, col: 2 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'VM', label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'HM', label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'CB', label: 'Stopper',           row: 3, col: 2 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-2-0-4',
    name: '1-2-0-4',
    description: 'all-in attack 😅',
    category: 'Offensiv',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'A',  label: 'Central angriber',  row: 1, col: 2 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'SS', label: 'Skygge-angriber',   row: 2, col: 2 },
      { key: 'VB', label: 'Venstre back',      row: 3, col: 1 },
      { key: 'HB', label: 'Højre back',        row: 3, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },

  // ─── Defensive ────────────────────────────────────────────────────────────
  {
    id: '1-4-1-1',
    name: '1-4-1-1',
    description: 'meget kompakt',
    category: 'Defensiv',
    // 1 striker, 1 mid, 3-man back line + 1 sweeper behind = 4 defenders
    slots: [
      { key: 'A',   label: 'Angriber',           row: 1, col: 2 },
      { key: 'CM',  label: 'Central midtbane',   row: 2, col: 2 },
      { key: 'VB',  label: 'Venstre back',       row: 3, col: 1 },
      { key: 'CB',  label: 'Midterback',         row: 3, col: 2 },
      { key: 'HB',  label: 'Højre back',         row: 3, col: 3 },
      { key: 'VCB', label: 'Sweeper / libero',   row: 4, col: 2 },
      { key: 'MV',  label: 'Målvogter',          row: 5, col: 2 },
    ],
  },
  {
    id: '1-3-1-2',
    name: '1-3-1-2',
    description: 'god balance defensivt',
    category: 'Defensiv',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'CM', label: 'Central midtbane',  row: 2, col: 2 },
      { key: 'VB', label: 'Venstre back',      row: 3, col: 1 },
      { key: 'CB', label: 'Midterback',        row: 3, col: 2 },
      { key: 'HB', label: 'Højre back',        row: 3, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 4, col: 2 },
    ],
  },
  {
    id: '1-5-0-1',
    name: '1-5-0-1',
    description: 'park the bus',
    category: 'Defensiv',
    // 2 wide backs slightly higher (close wide channels), 3-man wall close to GK
    slots: [
      { key: 'A',   label: 'Angriber',           row: 1, col: 2 },
      { key: 'VB',  label: 'Venstre back',       row: 2, col: 1 },
      { key: 'HB',  label: 'Højre back',         row: 2, col: 3 },
      { key: 'VCB', label: 'Venstre centerback', row: 3, col: 1 },
      { key: 'CB',  label: 'Midterback',         row: 3, col: 2 },
      { key: 'HCB', label: 'Højre centerback',   row: 3, col: 3 },
      { key: 'MV',  label: 'Målvogter',          row: 4, col: 2 },
    ],
  },
  {
    id: '1-4-2-0',
    name: '1-4-2-0',
    description: 'luk kampen ned',
    category: 'Defensiv',
    // 2 wide mids most advanced, 3-man back line, 1 sweeper — 0 forwards
    slots: [
      { key: 'VM',  label: 'Venstre midtbane',   row: 1, col: 1 },
      { key: 'HM',  label: 'Højre midtbane',     row: 1, col: 3 },
      { key: 'VB',  label: 'Venstre back',       row: 2, col: 1 },
      { key: 'CB',  label: 'Midterback',         row: 2, col: 2 },
      { key: 'HB',  label: 'Højre back',         row: 2, col: 3 },
      { key: 'VCB', label: 'Sweeper / libero',   row: 3, col: 2 },
      { key: 'MV',  label: 'Målvogter',          row: 4, col: 2 },
    ],
  },

  // ─── Special / Fleksible ─────────────────────────────────────────────────
  {
    id: 'diamant',
    name: 'Diamant',
    description: '1-2-1-2-1',
    category: 'Special',
    // True diamond: A (top) → VM+HM (wide) → CMD (bottom pivot) → VB+HB (DEF) → MV
    slots: [
      { key: 'A',   label: 'Angriber',          row: 1, col: 2 },
      { key: 'VM',  label: 'Venstre midtbane',  row: 2, col: 1 },
      { key: 'HM',  label: 'Højre midtbane',    row: 2, col: 3 },
      { key: 'CMD', label: 'Ankermand',         row: 3, col: 2 },
      { key: 'VB',  label: 'Venstre back',      row: 4, col: 1 },
      { key: 'HB',  label: 'Højre back',        row: 4, col: 3 },
      { key: 'MV',  label: 'Målvogter',         row: 5, col: 2 },
    ],
  },
  {
    id: '1-1-2-2-1',
    name: '1-1-2-2-1',
    description: 'kontrol + bredde',
    category: 'Special',
    slots: [
      { key: 'A',   label: 'Angriber',           row: 1, col: 2 },
      { key: 'VM',  label: 'Venstre off. midt',  row: 2, col: 1 },
      { key: 'HM',  label: 'Højre off. midt',    row: 2, col: 3 },
      { key: 'VCM', label: 'Venstre def. midt',  row: 3, col: 1 },
      { key: 'HCM', label: 'Højre def. midt',    row: 3, col: 3 },
      { key: 'CB',  label: 'Stopper',            row: 4, col: 2 },
      { key: 'MV',  label: 'Målvogter',          row: 5, col: 2 },
    ],
  },
  {
    id: '1-3-3',
    name: '1-3-3',
    description: 'flydende offensiv',
    category: 'Special',
    slots: [
      { key: 'VA', label: 'Venstre wing',      row: 1, col: 1 },
      { key: 'A',  label: 'Central angriber',  row: 1, col: 2 },
      { key: 'HA', label: 'Højre wing',        row: 1, col: 3 },
      { key: 'VB', label: 'Venstre back',      row: 2, col: 1 },
      { key: 'CB', label: 'Midterback',        row: 2, col: 2 },
      { key: 'HB', label: 'Højre back',        row: 2, col: 3 },
      { key: 'MV', label: 'Målvogter',         row: 3, col: 2 },
    ],
  },
  {
    id: '1-2-3',
    name: '1-2-3',
    description: 'simpel og fleksibel',
    category: 'Special',
    slots: [
      { key: 'VA',  label: 'Venstre wing',     row: 1, col: 1 },
      { key: 'A',   label: 'Central angriber', row: 1, col: 2 },
      { key: 'HA',  label: 'Højre wing',       row: 1, col: 3 },
      { key: 'VB',  label: 'Venstre back',     row: 2, col: 1 },
      { key: 'HB',  label: 'Højre back',       row: 2, col: 3 },
      { key: 'CMD', label: 'Ankermand',        row: 3, col: 2 },
      { key: 'MV',  label: 'Målvogter',        row: 4, col: 2 },
    ],
  },
]

export const DEFAULT_FORMATION = '1-2-3-1'

export function getFormation(id: string): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0]
}
