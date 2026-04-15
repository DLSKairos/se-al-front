import { ChevronDown } from 'lucide-react'
import { FormField } from '@/types'

interface SelectFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SelectField({ field, value, onChange, disabled }: SelectFieldProps) {
  const options = field.options ?? []

  return (
    <div className="relative">
      <select
        id={`field-${field.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none px-5 py-4 pr-10 rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(0,212,255,0.15)] text-[var(--off-white)] font-dm text-base outline-none focus:border-[var(--signal)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}
