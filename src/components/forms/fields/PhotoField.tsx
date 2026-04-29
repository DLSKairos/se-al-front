import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { FormField } from '@/types'

interface PhotoFieldProps {
  field: FormField
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function PhotoField({ field, value, onChange, disabled }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    onChange(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    onChange(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2" id={`field-${field.id}`} data-testid={`field-${field.key}`}>
      <input
        ref={inputRef}
        id={`input-${field.id}`}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />

      {preview ? (
        <div className="relative rounded-[var(--radius-input)] overflow-hidden border border-[var(--signal-dim)]">
          <img
            src={preview}
            alt="Vista previa"
            className="w-full max-h-64 object-contain bg-[var(--navy-mid)]"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              aria-label="Eliminar foto"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex flex-col items-center gap-3 px-4 py-8 rounded-[var(--radius-input)] border border-dashed border-white/20 bg-[var(--navy-mid)] text-[var(--muted)] hover:border-[var(--signal-dim)] hover:text-[var(--off-white)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-8 h-8" aria-hidden="true" />
          <span className="text-sm font-['DM_Sans']">
            {value ? 'Cambiar foto' : 'Tomar foto'}
          </span>
        </button>
      )}
    </div>
  )
}
