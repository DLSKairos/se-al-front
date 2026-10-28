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
      data-testid={`field-${field.key}`}
      className="flex gap-3"
      role="group"
      aria-label={field.label}
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        aria-pressed={value === true}
        className={`flex-1 min-h-[88px] rounded-[20px] border-[3px] text-center font-display font-extrabold text-[32px] transition-[transform,background-color] duration-150 active:scale-[0.97] disabled:opacity-50 ${
          value === true
            ? 'border-[var(--fg)] bg-[var(--ok)] text-[var(--on-ok)]'
            : 'border-[color:var(--line-strong)] bg-[var(--surface)] text-[var(--fg)]'
        }`}
      >
        Sí
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        aria-pressed={value === false}
        className={`flex-1 min-h-[88px] rounded-[20px] border-[3px] text-center font-display font-extrabold text-[32px] transition-[transform,background-color] duration-150 active:scale-[0.97] disabled:opacity-50 ${
          value === false
            ? 'border-[var(--fg)] bg-[var(--danger)] text-[var(--on-danger)]'
            : 'border-[color:var(--line-strong)] bg-[var(--surface)] text-[var(--fg)]'
        }`}
      >
        No
      </button>
    </div>
  )
}
