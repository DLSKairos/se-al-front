import { FormField } from '@/types'

interface NumberFieldProps {
  field: FormField
  value: number | ''
  onChange: (value: number | '') => void
  disabled?: boolean
}

export function NumberField({ field, value, onChange, disabled }: NumberFieldProps) {
  return (
    <input
      id={`field-${field.id}`}
      data-testid={`field-${field.key}`}
      type="number"
      value={value}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw === '' ? '' : Number(raw))
      }}
      disabled={disabled}
      placeholder={field.default_value ?? '0'}
      className="w-full px-5 py-4 rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] text-[var(--off-white)] placeholder-[var(--muted)] font-display text-2xl font-bold text-center outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
}
