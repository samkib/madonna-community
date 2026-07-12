export default function Loader({ label = 'Loading…', fullscreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-ink-soft">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
      <span className="text-sm font-body">{label}</span>
    </div>
  )

  if (fullscreen) {
    return <div className="min-h-screen flex items-center justify-center bg-bg">{content}</div>
  }
  return <div className="flex items-center justify-center py-16">{content}</div>
}

export function SkeletonRow() {
  return (
    <div className="h-14 rounded-plaque bg-surface-alt/60 overflow-hidden relative">
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgb(var(--color-surface) / 0.6), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}
