import type { ConfirmationStatus } from '../data/types'
import { STATUS_META } from '../lib/status'

/** A small pill showing a confirmation/traveler status. */
export function StatusBadge({
  status,
  className = '',
}: {
  status: ConfirmationStatus
  className?: string
}) {
  const m = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${m.border} ${m.bg} ${m.text} ${className}`}
    >
      <m.Icon className="h-3.5 w-3.5" aria-hidden={true} />
      {m.label}
    </span>
  )
}
