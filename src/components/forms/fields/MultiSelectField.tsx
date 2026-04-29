import { FormField } from '@/types'

interface MultiSelectFieldProps {
  field: FormField
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function MultiSelectField({ field, value, onChange, disabled }: MultiSelectFieldProps) {
  const options = field.options ?? []

  const handleToggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue))
    } else {
      onChange([...value, optValue])
    }
  }

  return (
    <fieldset className="flex flex-col gap-2" id={`field-${field.id}`} data-testid={`field-${field.key}`}>
      <legend className="sr-only">{field.label}</legend>
      {options.map((opt) => {
        const checked = value.includes(opt.value)
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-4 rounded-[14px] border cursor-pointer transition-all duration-200 select-none active:scale-[0.98] ${
              checked
                ? 'border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--off-white)]'
                : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--muted)] hover:border-white/20 hover:text-[var(--off-white)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleToggle(opt.value)}
              disabled={disabled}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                checked
                  ? 'bg-[var(--signal)] border-0'
                  : 'border border-[rgba(255,255,255,0.2)] bg-transparent'
              }`}
              aria-hidden="true"
            >
              {checked && (
                <svg className="w-3 h-3 text-[var(--navy)]" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className={`text-sm font-dm ${checked ? 'text-[var(--off-white)]' : 'text-[var(--muted)]'}`}>{opt.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
