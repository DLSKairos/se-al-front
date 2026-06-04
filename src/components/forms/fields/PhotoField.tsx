import { useRef } from 'react'
import { Camera, X, Plus } from 'lucide-react'
import { FormField } from '@/types'

interface PhotoFieldProps {
  field: FormField
  value: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export function PhotoField({ field, value = [], onChange, disabled }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevas = Array.from(e.target.files ?? [])
    if (!nuevas.length) return
    onChange([...value, ...nuevas])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3" id={`field-${field.id}`} data-testid={`field-${field.key}`}>
      <input
        ref={inputRef}
        id={`input-${field.id}`}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleAdd}
        disabled={disabled}
        className="sr-only"
      />

      {/* Grid de thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((file, i) => (
            <div key={i} className="relative aspect-square rounded-[var(--radius-input)] overflow-hidden border border-[var(--signal-dim)] bg-[var(--navy-mid)]">
              <img
                src={URL.createObjectURL(file)}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors"
                  aria-label={`Eliminar foto ${i + 1}`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}

          {/* Botón agregar más */}
          {!disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-[var(--radius-input)] border border-dashed border-white/20 bg-[var(--navy-mid)] flex flex-col items-center justify-center gap-1 text-[var(--muted)] hover:border-[var(--signal-dim)] hover:text-[var(--off-white)] transition-all"
              aria-label="Agregar foto"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-['DM_Sans']">Agregar</span>
            </button>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {value.length === 0 && !disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-3 px-4 py-8 rounded-[var(--radius-input)] border border-dashed border-white/20 bg-[var(--navy-mid)] text-[var(--muted)] hover:border-[var(--signal-dim)] hover:text-[var(--off-white)] transition-all"
        >
          <Camera className="w-8 h-8" aria-hidden="true" />
          <span className="text-sm font-['DM_Sans']">Tomar foto o seleccionar</span>
          <span className="text-xs font-['DM_Sans'] opacity-60">Puedes agregar varias fotos</span>
        </button>
      )}

      {value.length === 0 && disabled && (
        <p className="text-sm text-[var(--muted)] font-['DM_Sans'] text-center py-4">Sin fotos</p>
      )}
    </div>
  )
}
