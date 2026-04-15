import { FormField } from '@/types'

interface BooleanFieldProps {
  field: FormField
  value: boolean | null
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function BooleanField({ field, value, onChange, disabled }: BooleanFieldProps) {
  return (
    <div
      id={`field-${field.id}`}
      className="flex gap-3"
      role="group"
      aria-label={field.label}
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        aria-pressed={value === true}
        className={`flex-1 p-6 rounded-[16px] border text-center font-display font-extrabold text-2xl transition-all duration-200 active:scale-[0.97] ${
          value === true
            ? 'border-2 border-emerald-500 bg-[rgba(34,197,94,0.15)] text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
            : 'border border-white/10 bg-[rgba(255,255,255,0.03)] text-[var(--off-white)] hover:border-emerald-500/50 hover:text-emerald-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Sí
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        aria-pressed={value === false}
        className={`flex-1 p-6 rounded-[16px] border text-center font-display font-extrabold text-2xl transition-all duration-200 active:scale-[0.97] ${
          value === false
            ? 'border-2 border-red-500 bg-[rgba(239,68,68,0.15)] text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : 'border border-white/10 bg-[rgba(255,255,255,0.03)] text-[var(--off-white)] hover:border-red-500/50 hover:text-red-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        No
      </button>
    </div>
  )
}
