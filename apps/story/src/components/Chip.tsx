import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

export type ChipTone = 'neutral' | 'pending' | 'warning' | 'confirmed'

const TONES: Record<ChipTone, { classes: string; icon: LucideIcon; spin?: boolean }> = {
  neutral: {
    classes: 'border-slate-700 bg-slate-900/70 text-slate-300',
    icon: CheckCircle2,
  },
  pending: {
    classes: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
    icon: Loader2,
    spin: true,
  },
  warning: {
    classes: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    icon: AlertTriangle,
  },
  confirmed: {
    classes: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    icon: CheckCircle2,
  },
}

interface ChipProps {
  tone?: ChipTone
  children: React.ReactNode
  icon?: LucideIcon
}

export function Chip({ tone = 'neutral', children, icon }: ChipProps) {
  const spec = TONES[tone]
  const Icon = icon ?? spec.icon
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${spec.classes}`}
    >
      <Icon aria-hidden="true" className={`h-4 w-4 ${spec.spin ? 'animate-spin' : ''}`} />
      {children}
    </span>
  )
}
