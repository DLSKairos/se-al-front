import { useEffect, useRef, useState } from 'react'
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Plus,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditorSection } from '@/types'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { FieldRow } from './FieldRow'

// ── SectionOptionsMenu ─────────────────────────────────────────────────────────

interface SectionOptionsMenuProps {
  hasObservations: boolean
  onToggleObservations: () => void
  onDelete: () => void
}

function SectionOptionsMenu({
  hasObservations,
  onToggleObservations,
  onDelete,
}: SectionOptionsMenuProps) {
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
        className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] transition-colors"
        aria-label="Opciones de sección"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--navy-mid)] border border-[rgba(0,212,255,0.15)] rounded-lg shadow-xl p-1 w-52 z-50">
          <button
            onClick={() => handle(onToggleObservations)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] cursor-pointer text-left"
          >
            <MessageSquare size={13} className="text-[var(--muted)]" />
            {hasObservations ? 'Quitar observaciones' : 'Agregar observaciones'}
          </button>
          <div className="my-1 border-t border-white/5" />
          <button
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 cursor-pointer text-left"
          >
            <Trash2 size={13} />
            Eliminar sección
          </button>
        </div>
      )}
    </div>
  )
}

// ── SortableFieldWrapper ───────────────────────────────────────────────────────

interface SortableFieldWrapperProps {
  fieldId: string
  sectionId: string
  children: (props: { dragHandleProps: Record<string, unknown>; isDragging: boolean }) => React.ReactNode
}

function SortableFieldWrapper({ fieldId, sectionId, children }: SortableFieldWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fieldId,
    data: { type: 'field', sectionId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners }, isDragging })}
    </div>
  )
}

// ── SectionBlock ───────────────────────────────────────────────────────────────

export interface SectionBlockProps {
  section: EditorSection
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
}

export function SectionBlock({ section, dragHandleProps, isDragging }: SectionBlockProps) {
  const { updateSection, removeSection, addField } = useFormEditorStore()
  const [collapsed, setCollapsed] = useState(false)
  const [sectionName, setSectionName] = useState(section.name)

  useEffect(() => {
    setSectionName(section.name)
  }, [section.name])

  function commitName() {
    const trimmed = sectionName.trim()
    if (!trimmed) {
      setSectionName(section.name)
      return
    }
    updateSection(section.id, { name: trimmed })
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  function handleToggleObservations() {
    updateSection(section.id, { hasObservations: !section.hasObservations })
  }

  const fieldIds = section.fields.map((f) => f.id)

  return (
    <div
      className={`border border-[rgba(0,212,255,0.12)] rounded-xl mb-3 overflow-hidden transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Header */}
      <div className="bg-[var(--navy-mid)] px-4 py-3 flex items-center gap-2">
        {/* Drag handle de sección */}
        <button
          {...dragHandleProps}
          className="text-[var(--muted)] hover:text-[var(--signal)] cursor-grab active:cursor-grabbing shrink-0 transition-colors"
          aria-label="Reordenar sección"
        >
          <GripVertical size={16} />
        </button>

        {/* Nombre editable */}
        <input
          type="text"
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleNameKeyDown}
          className="bg-transparent border-none outline-none text-sm font-semibold text-[var(--off-white)] flex-1 min-w-0 font-['Syne']"
          aria-label="Nombre de la sección"
        />

        {/* Badge de campos */}
        <span className="text-xs text-[var(--muted)] px-2 py-0.5 rounded-full bg-white/5 shrink-0">
          {section.fields.length + (section.hasObservations ? 1 : 0)} campos
        </span>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--off-white)] hover:bg-[rgba(0,212,255,0.08)] transition-colors shrink-0"
          aria-label={collapsed ? 'Expandir sección' : 'Colapsar sección'}
        >
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>

        {/* Menu */}
        <SectionOptionsMenu
          hasObservations={section.hasObservations}
          onToggleObservations={handleToggleObservations}
          onDelete={() => removeSection(section.id)}
        />
      </div>

      {/* Body colapsable */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--navy)] px-2 py-2">
              <SortableContext
                items={fieldIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-0.5">
                  {section.fields.map((field) => (
                    <SortableFieldWrapper
                      key={field.id}
                      fieldId={field.id}
                      sectionId={section.id}
                    >
                      {({ dragHandleProps: fieldDragProps, isDragging: fieldDragging }) => (
                        <FieldRow
                          field={field}
                          sectionId={section.id}
                          dragHandleProps={fieldDragProps}
                          isDragging={fieldDragging}
                        />
                      )}
                    </SortableFieldWrapper>
                  ))}
                </div>
              </SortableContext>

              {/* Campo de observaciones (solo visual, no draggable) */}
              {section.hasObservations && (
                <div className="flex items-center gap-2 px-3 py-2 mt-0.5 rounded-lg border border-dashed border-[rgba(0,212,255,0.12)] opacity-60">
                  <GripVertical size={16} className="text-[var(--muted)]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]" />
                  <span className="text-sm text-[var(--muted)] flex-1 font-['DM_Sans'] italic">
                    Observaciones
                  </span>
                  <span className="text-xs text-[var(--muted)]">Texto</span>
                </div>
              )}

              {/* Botón agregar campo */}
              <button
                onClick={() => addField(section.id)}
                className="flex items-center gap-1 text-xs text-[var(--signal)] hover:text-[var(--signal)]/80 px-4 py-2 mt-1 transition-colors w-full"
                aria-label="Agregar campo a esta sección"
              >
                <Plus size={13} />
                Agregar campo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
