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
      className="w-full px-5 py-4 rounded-[14px] bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] border border-[color:var(--line)] text-[var(--off-white)] placeholder-[var(--muted)] font-display text-2xl font-bold text-center outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_15%,transparent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
}
