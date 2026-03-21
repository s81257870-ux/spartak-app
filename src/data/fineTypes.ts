export interface FineType {
  id: string
  label: string
  amount: number
  category: 'kamp' | 'glemte' | 'special'
}

export const FINE_TYPES: FineType[] = [
  // ── Kamprelaterede ──────────────────────────────────────────────────
  { id: 'forsent-kamp',    label: 'Forsent til kamp',                 amount: 25,  category: 'kamp'    },
  { id: 'udeblivelse',     label: 'Udeblivelse fra kamp uden besked', amount: 250, category: 'kamp'    },
  { id: 'afbud',           label: 'Afbud til kamp',                   amount: 25,  category: 'kamp'    },
  { id: 'afbud-24',        label: 'Afbud under 24 timer',             amount: 50,  category: 'kamp'    },
  { id: 'braendt-straffe', label: 'Brændt straffe',                   amount: 50,  category: 'kamp'    },
  { id: 'beget-straffe',   label: 'Begået straffe',                   amount: 50,  category: 'kamp'    },
  { id: 'selvmaal',        label: 'Selvmål',                          amount: 50,  category: 'kamp'    },
  { id: 'tre-aendringer',  label: '3 afbrændere på 100%',             amount: 25,  category: 'kamp'    },
  { id: 'tunnel',          label: 'Modspiller laver tunnel',          amount: 5,   category: 'kamp'    },
  { id: 'gult-kort',       label: 'Gult kort',                        amount: 50,  category: 'kamp'    },
  { id: 'roedt-kort',      label: 'Rødt kort',                        amount: 100, category: 'kamp'    },

  // ── Glemte ting ─────────────────────────────────────────────────────
  { id: 'stoevler',        label: 'Støvler',                          amount: 25,  category: 'glemte'  },
  { id: 'stroemper',       label: 'Strømper',                         amount: 10,  category: 'glemte'  },
  { id: 'shorts',          label: 'Shorts',                           amount: 25,  category: 'glemte'  },
  { id: 'troeje',          label: 'Trøje',                            amount: 50,  category: 'glemte'  },
  { id: 'ankelsokker',    label: 'Ankelsokker (kriminelt outfit)',    amount: 100, category: 'glemte'  },

  // ── Special ─────────────────────────────────────────────────────────
  // Selecting this creates one fine per signed-up player based on goals × 5 kr.
  { id: 'pr-maal',         label: 'Pr. mål der går ind',              amount: 5,   category: 'special' },
]

export const CATEGORY_LABELS: Record<FineType['category'], string> = {
  kamp:    'Kamprelaterede',
  glemte:  'Glemte ting',
  special: 'Special',
}
