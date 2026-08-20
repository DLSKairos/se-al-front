import { PlanTier } from '@/types'

// ── Etiquetas legibles de plan ───────────────────────────────────────────────

export const PLAN_LABEL: Record<PlanTier, string> = {
  STARTER:      'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE:   'Enterprise',
}

// ── Opciones para selects, derivadas de PLAN_LABEL ───────────────────────────

export const PLAN_OPTIONS: { value: PlanTier; label: string }[] = (
  Object.entries(PLAN_LABEL) as [PlanTier, string][]
).map(([value, label]) => ({ value, label }))
