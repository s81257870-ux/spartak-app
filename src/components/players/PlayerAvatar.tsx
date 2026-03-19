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

const colors = [
  'bg-green-700', 'bg-blue-700', 'bg-purple-700', 'bg-orange-700',
  'bg-pink-700', 'bg-teal-700', 'bg-red-700', 'bg-indigo-700',
]

const colorFor = (name: string) =>
  colors[name.charCodeAt(0) % colors.length]

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export default function PlayerAvatar({ name, size = 'md', className = '' }: Props) {
  return (
    <div
      className={`${sizes[size]} ${colorFor(name)} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${className}`}
    >
      {initials(name)}
    </div>
  )
}
