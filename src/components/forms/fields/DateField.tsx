import { FormField } from '@/types'

interface DateFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DateField({ field, value, onChange, disabled }: DateFieldProps) {
  return (
    <input
      id={`field-${field.id}`}
      data-testid={`field-${field.key}`}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-5 py-4 rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] text-[var(--off-white)] font-dm text-base outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
    />
  )
}
