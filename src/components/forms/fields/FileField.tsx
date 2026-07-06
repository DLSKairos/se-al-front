import { useRef } from 'react'
import { Paperclip, X } from 'lucide-react'
import { FormField } from '@/types'

interface FileFieldProps {
  field: FormField
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function FileField({ field, value, onChange, disabled }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Fix L3: primera barrera de tipo en el cliente (la validación real de
  // magic bytes es server-side). Restringe a documentos e imágenes comunes.
  const ACCEPTED = 'image/*,.pdf,.doc,.docx,.xls,.xlsx'
  const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx']

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const ok = file.type.startsWith('image/') || ACCEPTED_EXTENSIONS.includes(ext)
      if (!ok) {
        if (inputRef.current) inputRef.current.value = ''
        onChange(null)
        return
      }
    }
    onChange(file)
  }

  const handleClear = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2" id={`field-${field.id}`} data-testid={`field-${field.key}`}>
      <input
        ref={inputRef}
        id={`input-${field.id}`}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />

      {value ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-input)] border border-[var(--signal-dim)] bg-[var(--navy-mid)]">
          <Paperclip className="w-4 h-4 text-[var(--signal)] shrink-0" aria-hidden="true" />
          <span className="text-sm text-[var(--off-white)] font-['DM_Sans'] truncate flex-1">
            {value.name}
          </span>
          <span className="text-xs text-[var(--muted)] shrink-0">
            {(value.size / 1024).toFixed(0)} KB
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[var(--muted)] hover:text-red-400 transition-colors shrink-0"
              aria-label="Eliminar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-input)] border border-dashed border-white/20 bg-[var(--navy-mid)] text-[var(--muted)] hover:border-[var(--signal-dim)] hover:text-[var(--off-white)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-sm font-['DM_Sans']">Seleccionar archivo</span>
        </button>
      )}
    </div>
  )
}
