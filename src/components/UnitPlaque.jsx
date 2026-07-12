import { Home } from 'lucide-react'

/**
 * The signature visual motif of Madonna Community: a small engraved
 * door-plaque, echoing the literal numbered plaques on the estate's
 * 114 units. Used in the sidebar, unit tables, and profile pages so
 * a resident's unit number is always rendered the same, recognizable way.
 */
export default function UnitPlaque({ unitNumber, size = 'md', blank = false }) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  if (blank || !unitNumber) {
    return (
      <span className={`unit-plaque-blank ${sizes[size]} font-mono`}>
        <Home size={size === 'lg' ? 16 : 13} className="opacity-60" />
        <span className="ml-1.5">unassigned</span>
      </span>
    )
  }

  return (
    <span className={`unit-plaque ${sizes[size]}`}>
      <Home size={size === 'lg' ? 16 : 13} className="opacity-80" />
      {unitNumber}
    </span>
  )
}
