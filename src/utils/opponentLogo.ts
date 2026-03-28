/**
 * opponentLogo.ts — maps opponent display names to logo files in /public/.
 *
 * Matching strategy: lowercase includes() against a normalised key.
 * This handles division suffixes automatically:
 *   "B 1903 4", "B 1903 5"  →  both contain "b 1903"  →  same logo
 *   "FC Ryparken 7", "FC Ryparken 8"  →  both contain "fc ryparken"
 *
 * Add new entries here when new opponents are added to the schedule.
 * The path is resolved via Vite's BASE_URL so sub-path deployments work.
 */

const BASE = import.meta.env.BASE_URL

/** Each entry: a lowercase substring to test against the opponent name. */
const LOGO_MAP: { match: string; path: string }[] = [
  { match: 'b 1903',        path: `${BASE}b1903.png`         },
  { match: 'bispebjerg',    path: `${BASE}bispebjerg.png`    },
  { match: 'fb 24',         path: `${BASE}frederiksberg.png` },
  { match: 'frederiksberg', path: `${BASE}frederiksberg.png` },
  { match: 'olympiakos',    path: `${BASE}olympiakos.png`    },
  { match: 'fc ryparken',   path: `${BASE}ryparken.png`      },
  { match: 'ryparken',      path: `${BASE}ryparken.png`      },
  { match: 'skjold',        path: `${BASE}skjold.png`        },
]

/**
 * Returns the public logo path for a given opponent name, or null if none
 * is available.  The caller should render a neutral shield fallback for null.
 *
 * Case-insensitive.  Division suffixes ("B 1903 4", "Skjold 21") are ignored
 * because the loop tests via `.includes()` against a shorter canonical key.
 */
export function getOpponentLogo(opponent: string): string | null {
  const lower = opponent.trim().toLowerCase()
  for (const entry of LOGO_MAP) {
    if (lower.includes(entry.match)) return entry.path
  }
  return null
}
