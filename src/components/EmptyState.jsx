export default function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-up">
      <div className="w-16 h-16 rounded-plaque border-2 border-dashed border-line flex items-center justify-center mb-4 text-ink-soft">
        {Icon ? <Icon size={26} strokeWidth={1.5} /> : null}
      </div>
      <p className="font-display text-lg italic text-ink-soft">{title}</p>
      {hint ? <p className="text-sm text-ink-soft/80 mt-1.5 max-w-xs">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
