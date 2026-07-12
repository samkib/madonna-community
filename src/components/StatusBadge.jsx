const STATUS_STYLES = {
  Pending: 'bg-pending/15 text-pending',
  'In Progress': 'bg-progress/15 text-progress',
  Solved: 'bg-solved/15 text-solved',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-surface-alt text-ink-soft'
  return <span className={`badge ${style}`}>{status}</span>
}

export function UrgentBadge() {
  return (
    <span className="badge bg-urgent/15 text-urgent">
      <span className="w-1.5 h-1.5 rounded-full bg-urgent" />
      Urgent
    </span>
  )
}

export function CategoryBadge({ category }) {
  return <span className="badge bg-surface-alt text-ink-soft border border-line">{category}</span>
}
