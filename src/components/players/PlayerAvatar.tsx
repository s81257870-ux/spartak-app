interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

// Single-hue palette — all red derived from the brand accent color.
// Eight distinct shades to avoid consecutive players looking identical,
// while keeping the overall list visually cohesive.
const PALETTE: { bg: string; color: string }[] = [
  { bg: 'rgba(220,38,38,0.18)',  color: '#DC2626' },
  { bg: 'rgba(197,48,48,0.20)',  color: '#C53030' },
  { bg: 'rgba(252,129,129,0.16)', color: '#FC8181' },
  { bg: 'rgba(220,38,38,0.12)',  color: '#FEB2B2' },
  { bg: 'rgba(185,28,28,0.22)',  color: '#F87171' },
  { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444' },
  { bg: 'rgba(220,38,38,0.18)',  color: '#DC2626' },
  { bg: 'rgba(252,165,165,0.15)', color: '#FCA5A5' },
]

const paletteFor = (name: string) =>
  PALETTE[name.charCodeAt(0) % PALETTE.length]

const sizes = {
  sm: { dim: 'w-8 h-8', text: '0.7rem' },
  md: { dim: 'w-10 h-10', text: '0.8rem' },
  lg: { dim: 'w-14 h-14', text: '1.1rem' },
}

export default function PlayerAvatar({ name, size = 'md', className = '' }: Props) {
  const { bg, color } = paletteFor(name)
  const { dim, text } = sizes[size]
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{
        background: bg,
        border: `1px solid ${color}40`,
        color,
        fontSize: text,
        letterSpacing: '0.04em',
      }}
    >
      {initials(name)}
    </div>
  )
}
