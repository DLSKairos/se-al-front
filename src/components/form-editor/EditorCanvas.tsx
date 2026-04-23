import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditorField, EditorSection } from '@/types'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { SectionBlock } from './SectionBlock'
import { FieldRow } from './FieldRow'

// ── SortableSectionWrapper ─────────────────────────────────────────────────────

interface SortableSectionWrapperProps {
  section: EditorSection
}

function SortableSectionWrapper({ section }: SortableSectionWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: 'section' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <SectionBlock
        section={section}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}

// ── EditorCanvas ───────────────────────────────────────────────────────────────

export function EditorCanvas() {
  const {
    state,
    addSection,
    reorderSections,
    moveField,
    reorderFieldsInSection,
  } = useFormEditorStore()

  const { sections } = state

  const [activeSection, setActiveSection] = useState<EditorSection | null>(null)
  const [activeField, setActiveField] = useState<{ field: EditorField; sectionId: string } | null>(null)
  // Para DragOver cross-section
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const data = active.data.current

    if (data?.type === 'section') {
      const sec = sections.find((s) => s.id === active.id)
      setActiveSection(sec ?? null)
      setActiveField(null)
    } else if (data?.type === 'field') {
      const sec = sections.find((s) => s.id === data.sectionId)
      const field = sec?.fields.find((f) => f.id === active.id)
      setActiveField(field ? { field, sectionId: data.sectionId } : null)
      setActiveSection(null)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id as string ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveSection(null)
    setActiveField(null)
    setOverId(null)

    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    // Reordenar secciones
    if (activeData?.type === 'section') {
      const fromIndex = sections.findIndex((s) => s.id === active.id)
      const toIndex = sections.findIndex((s) => s.id === over.id)
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderSections(fromIndex, toIndex)
      }
      return
    }

    // Mover campos
    if (activeData?.type === 'field') {
      const fromSectionId = activeData.sectionId
      const fromSection = sections.find((s) => s.id === fromSectionId)
      if (!fromSection) return

      const fromIndex = fromSection.fields.findIndex((f) => f.id === active.id)
      if (fromIndex === -1) return

      // Determinar la sección destino y el índice destino
      let toSectionId: string
      let toIndex: number

      if (overData?.type === 'field') {
        // Soltando sobre otro campo
        toSectionId = overData.sectionId
        const toSection = sections.find((s) => s.id === toSectionId)
        if (!toSection) return
        toIndex = toSection.fields.findIndex((f) => f.id === over.id)
        if (toIndex === -1) toIndex = toSection.fields.length
      } else if (overData?.type === 'section') {
        // Soltando sobre la sección directamente
        toSectionId = over.id as string
        const toSection = sections.find((s) => s.id === toSectionId)
        if (!toSection) return
        toIndex = toSection.fields.length
      } else {
        // Intentar resolver por id de sección
        const maybeSec = sections.find((s) => s.id === over.id)
        if (maybeSec) {
          toSectionId = maybeSec.id
          toIndex = maybeSec.fields.length
        } else {
          return
        }
      }

      if (fromSectionId === toSectionId) {
        reorderFieldsInSection(fromSectionId, fromIndex, toIndex)
      } else {
        moveField(fromSectionId, toSectionId, fromIndex, toIndex)
      }
    }
  }

  const sectionIds = sections.map((s) => s.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {sections.map((section) => (
            <SortableSectionWrapper key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>

      {/* Botón agregar sección */}
      <button
        onClick={() => addSection()}
        className="flex items-center gap-2 text-sm text-[var(--signal)] hover:text-[var(--signal)]/80 px-4 py-3 rounded-xl border border-dashed border-[rgba(0,212,255,0.2)] hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.04)] transition-all w-full mt-2"
        aria-label="Agregar nueva sección"
      >
        <Plus size={15} />
        Agregar sección
      </button>

      {/* DragOverlay — muestra una preview mientras se arrastra */}
      <DragOverlay>
        {activeSection && (
          <div className="border border-[rgba(0,212,255,0.4)] rounded-xl bg-[var(--navy-mid)] px-4 py-3 text-sm font-semibold text-[var(--off-white)] shadow-xl opacity-90">
            {activeSection.name}
          </div>
        )}
        {activeField && (
          <div className="bg-[var(--navy-mid)] border border-[rgba(0,212,255,0.3)] rounded-lg px-3 py-2 text-sm text-[var(--off-white)] shadow-xl opacity-90">
            {activeField.field.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
