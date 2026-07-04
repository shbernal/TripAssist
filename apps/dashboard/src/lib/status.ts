import {
  Accessibility,
  AlertTriangle,
  BedDouble,
  Brain,
  Car,
  CheckCircle2,
  Ear,
  Eye,
  HeartPulse,
  Loader2,
  Plane,
  type LucideIcon,
} from 'lucide-react'
import type { ConfirmationKind, ConfirmationStatus, NeedCategory } from '../data/types'

export interface StatusMeta {
  label: string
  Icon: LucideIcon
  /** Text + border + fill colors used for badges/dots. */
  text: string
  border: string
  bg: string
  dot: string
}

export const STATUS_META: Record<ConfirmationStatus, StatusMeta> = {
  confirmed: {
    label: 'Confirmé',
    Icon: CheckCircle2,
    text: 'text-ok',
    border: 'border-ok/40',
    bg: 'bg-ok/10',
    dot: 'bg-ok',
  },
  pending: {
    label: 'En cours',
    Icon: Loader2,
    text: 'text-warn',
    border: 'border-warn/40',
    bg: 'bg-warn/10',
    dot: 'bg-warn',
  },
  attention: {
    label: 'À traiter',
    Icon: AlertTriangle,
    text: 'text-alert',
    border: 'border-alert/40',
    bg: 'bg-alert/10',
    dot: 'bg-alert',
  },
}

export const KIND_META: Record<ConfirmationKind, { label: string; Icon: LucideIcon }> = {
  airport: { label: 'Aéroport', Icon: Plane },
  hotel: { label: 'Hôtel', Icon: BedDouble },
  transfer: { label: 'Transfert', Icon: Car },
}

export const CATEGORY_ICON: Record<NeedCategory, LucideIcon> = {
  'Fauteuil roulant': Accessibility,
  'Mobilité réduite': Accessibility,
  'Déficience visuelle': Eye,
  'Déficience auditive': Ear,
  'Trouble cognitif': Brain,
  'Condition chronique': HeartPulse,
}
