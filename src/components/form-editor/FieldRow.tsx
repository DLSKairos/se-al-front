import { useEffect, useRef, useState } from 'react'
import { GripVertical, MoreVertical, Settings, Copy, Trash2 } from 'lucide-react'
import { EditorField } from '@/types'
import { FIELD_TYPE_LABELS, FIELD_TYPE_ICON_NAMES, toSnakeCase } from '@/utils/fieldType.utils'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { FieldTypePopover, DynamicIcon } from './FieldTypePopover'

// ── OptionsMenu ────────────────────────────────────────────────────────────────

interface OptionsMenuProps {
  onAdvanced: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function OptionsMenu({ onAdvanced, onDuplicate, onDelete }: OptionsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handle(fn: () => void) {
    fn()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p) }}
        className="p-1 rounded text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Opciones del campo"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--navy-mid)] border border-[rgba(0,212,255,0.15)] rounded-lg shadow-xl p-1 w-44 z-50">
          <button
            onClick={() => handle(onAdvanced)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] cursor-pointer text-left"
          >
            <Settings size={13} className="text-[var(--muted)]" />
            Configuración avanzada
          </button>
          <button
            onClick={() => handle(onDuplicate)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] cursor-pointer text-left"
          >
            <Copy size={13} className="text-[var(--muted)]" />
            Duplicar campo
          </button>
          <div className="my-1 border-t border-white/5" />
          <button
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 cursor-pointer text-left"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

// ── FieldRow ───────────────────────────────────────────────────────────────────

export interface FieldRowProps {
  field: EditorField
  sectionId: string
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

export function FieldRow({ field, sectionId, dragHandleProps, isDragging }: FieldRowProps) {
  const { updateField, removeField, addField } = useFormEditorStore()
  const [label, setLabel] = useState(field.label)

  // Sincronizar si el campo cambia externamente (p.ej. AI)
  useEffect(() => {
    setLabel(field.label)
  }, [field.label])

  function commitLabel() {
    const trimmed = label.trim()
    if (!trimmed) {
      setLabel(field.label)
      return
    }
    const newKey = toSnakeCase(trimmed)
    updateField(sectionId, field.id, { label: trimmed, key: newKey })
  }

  function handleLabelKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  function handleToggleRequired() {
    updateField(sectionId, field.id, { required: !field.required })
  }

  function handleTypeChange(type: EditorField['type']) {
    updateField(sectionId, field.id, { type })
  }

  function handleDuplicate() {
    addField(sectionId, {
      label: `${field.label} (copia)`,
      key: `${field.key}_copia`,
      type: field.type,
      required: field.required,
      options: field.options,
      placeholder: field.placeholder,
      helpText: field.helpText,
    })
  }

  return (
    <div
      className={`flex items-center gap-2 group px-3 py-2 rounded-lg border transition-all ${
        isDragging
          ? 'opacity-50 border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.04)]'
          : 'border-transparent hover:border-[rgba(0,212,255,0.10)] hover:bg-[rgba(0,212,255,0.04)]'
      }`}
    >
      {/* Drag handle */}
      <button
        {...dragHandleProps}
        className="text-[var(--muted)] group-hover:text-[var(--signal)] cursor-grab active:cursor-grabbing shrink-0 transition-colors"
        aria-label="Reordenar campo"
        tabIndex={0}
      >
        <GripVertical size={16} />
      </button>

      {/* Required indicator */}
      <button
        onClick={handleToggleRequired}
        title={field.required ? 'Requerido (click para hacer opcional)' : 'Opcional (click para hacer requerido)'}
        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors cursor-pointer ${
          field.required ? 'bg-[var(--signal)]' : 'bg-[var(--muted)]'
        }`}
        aria-label={field.required ? 'Campo requerido' : 'Campo opcional'}
      />

      {/* Label editable */}
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={commitLabel}
        onKeyDown={handleLabelKeyDown}
        className="bg-transparent border-none outline-none text-sm text-[var(--off-white)] flex-1 min-w-0 font-['DM_Sans'] placeholder:text-[var(--muted)]"
        placeholder="Etiqueta del campo"
        aria-label="Nombre del campo"
      />

      {/* Tipo selector */}
      <FieldTypePopover currentType={field.type} onChange={handleTypeChange}>
        <div className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--signal)] px-2 py-1 rounded transition-colors cursor-pointer shrink-0">
          <DynamicIcon name={FIELD_TYPE_ICON_NAMES[field.type]} size={12} />
          <span className="hidden sm:inline">{FIELD_TYPE_LABELS[field.type]}</span>
        </div>
      </FieldTypePopover>

      {/* Menu de opciones */}
      <OptionsMenu
        onAdvanced={() => {/* TODO: abrir configuración avanzada */}}
        onDuplicate={handleDuplicate}
        onDelete={() => removeField(sectionId, field.id)}
      />
    </div>
  )
}
