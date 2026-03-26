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

// Single-hue palette — all steel-blue derived from the accent color.
// Eight distinct shades to avoid consecutive players looking identical,
// while keeping the overall list visually cohesive.
const PALETTE: { bg: string; color: string }[] = [
  { bg: 'rgba(149,197,233,0.18)', color: '#95C5E9' },
  { bg: 'rgba(116,174,215,0.20)', color: '#74AED7' },
  { bg: 'rgba(86,148,195,0.18)',  color: '#5694C3' },
  { bg: 'rgba(60,120,172,0.22)',  color: '#8DC0E8' },
  { bg: 'rgba(149,197,233,0.12)', color: '#AACCEC' },
  { bg: 'rgba(96,163,210,0.20)',  color: '#60A3D2' },
  { bg: 'rgba(130,185,228,0.16)', color: '#82B9E4' },
  { bg: 'rgba(70,135,185,0.22)',  color: '#A3CBEB' },
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
