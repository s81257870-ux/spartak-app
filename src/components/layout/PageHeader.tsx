interface Props {
  label: string
  title: string
}

/**
 * Shared page header used across all main sections.
 * Renders the blue vertical bar, uppercase label, and large bold title.
 * Each page keeps its own subtitle / action button outside this component.
 */
export default function PageHeader({ label, title }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 rounded-full" style={{ background: 'var(--section-bar-bg)' }} />
        <span
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: 'var(--section-label-color)' }}
        >
          {label}
        </span>
      </div>
      <h1
        className="text-[2rem] font-black tracking-tight leading-none mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
    </div>
  )
}
