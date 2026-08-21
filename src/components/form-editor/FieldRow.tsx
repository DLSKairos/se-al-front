import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GripVertical, MoreVertical, Copy, Trash2, Plus, X } from 'lucide-react'
import { EditorField } from '@/types'
import { FIELD_TYPE_LABELS, FIELD_TYPE_ICON_NAMES, toSnakeCase } from '@/utils/fieldType.utils'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { useClickOutside } from '@/hooks/useClickOutside'
import { FieldTypePopover, DynamicIcon } from './FieldTypePopover'

// ── OptionsMenu ────────────────────────────────────────────────────────────────

interface OptionsMenuProps {
  onDuplicate: () => void
  onDelete: () => void
}

function OptionsMenu({ onDuplicate, onDelete }: OptionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation()
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen((p) => !p)
  }

  // El trigger detiene el mousedown para que el hook (basado solo en menuRef,
  // ya que el menú está portado fuera del árbol DOM del trigger) no lo procese
  // como "click afuera" y cierre el menú antes de que el onClick lo vuelva a abrir.
  useClickOutside(menuRef, () => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    document.addEventListener('scroll', () => setOpen(false), { capture: true, once: true })
  }, [open])

  function handle(fn: () => void) {
    fn()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={openMenu}
        onMouseDown={(e) => e.stopPropagation()}
        className="p-1 rounded text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Opciones del campo"
      >
        <MoreVertical size={14} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="glass-card-md p-1 w-44"
        >
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
        </div>,
        document.body,
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
  const [helpText, setHelpText] = useState(field.helpText ?? '')
  const [newOption, setNewOption] = useState('')
  const newOptionRef = useRef<HTMLInputElement>(null)

  // Sincronizar si el campo cambia externamente (p.ej. AI)
  useEffect(() => {
    setLabel(field.label)
  }, [field.label])

  useEffect(() => {
    setHelpText(field.helpText ?? '')
  }, [field.helpText])

  function commitLabel() {
    const trimmed = label.trim()
    if (!trimmed) {
      setLabel(field.label)
      return
    }
    const newKey = toSnakeCase(trimmed)
    updateField(sectionId, field.id, { label: trimmed, key: newKey })
  }

  function commitHelpText() {
    updateField(sectionId, field.id, { helpText: helpText.trim() || undefined })
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

  const isChoice = field.type === 'SELECT' || field.type === 'MULTISELECT'
  const options = field.options ?? []

  function addOption() {
    const val = newOption.trim()
    if (!val || options.includes(val)) return
    updateField(sectionId, field.id, { options: [...options, val] })
    setNewOption('')
    newOptionRef.current?.focus()
  }

  function removeOption(idx: number) {
    updateField(sectionId, field.id, { options: options.filter((_, i) => i !== idx) })
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addOption() }
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
      className={`flex flex-col group px-3 py-2 rounded-lg border transition-all ${
        isDragging
          ? 'opacity-50 border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.04)]'
          : 'border-transparent hover:border-[rgba(0,212,255,0.10)] hover:bg-[rgba(0,212,255,0.04)]'
      }`}
    >
      {/* Fila principal */}
      <div className="flex items-center gap-2">
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
          onDuplicate={handleDuplicate}
          onDelete={() => removeField(sectionId, field.id)}
        />
      </div>

      {/* Fila de descripción / pregunta */}
      <div className="pl-[52px] pr-1">
        <input
          type="text"
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          onBlur={commitHelpText}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          className="bg-transparent border-none outline-none text-xs text-[var(--muted)] w-full font-['DM_Sans'] placeholder:text-[var(--muted)]/50 focus:text-[var(--off-white)] transition-colors"
          placeholder="Descripción o pregunta para el operario (opcional)"
          aria-label="Descripción del campo"
        />
      </div>

      {/* Opciones de selección */}
      {isChoice && (
        // stopPropagation en pointer events para que dnd-kit no capture
        // interacciones dentro del área de opciones
        <div
          className="pl-[52px] pr-1 pt-2 flex flex-col gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Lista de opciones existentes */}
          {options.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {options.map((opt, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-['DM_Sans'] bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.18)] text-[var(--off-white)]"
                >
                  {opt}
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-[var(--muted)] hover:text-red-400 transition-colors ml-0.5"
                    aria-label={`Eliminar opción "${opt}"`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input para nueva opción */}
          <div
            className="flex items-center gap-1.5 rounded-md px-2 py-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}
          >
            <input
              ref={newOptionRef}
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={handleOptionKeyDown}
              placeholder="Escribe una opción y presiona Enter…"
              className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--off-white)] font-['DM_Sans'] placeholder:text-[var(--muted)] min-w-0"
              aria-label="Agregar nueva opción"
            />
            <button
              type="button"
              onClick={addOption}
              disabled={!newOption.trim()}
              className="shrink-0 text-[var(--signal)] hover:text-[var(--signal)]/70 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              aria-label="Agregar opción"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
