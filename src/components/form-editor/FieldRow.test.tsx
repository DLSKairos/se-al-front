import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { FieldRow } from './FieldRow'
import { useFormEditorStore } from '@/stores/formEditorStore'
import { EditorField } from '@/types'

// ── Mock DnD Kit (FieldRow no lo usa directamente pero sus deps lo importan) ──

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn(),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const SECTION_ID = 'section-test-1'

const textEditorField: EditorField = {
  id: 'field-text-1',
  label: 'Nombre completo',
  key: 'nombre_completo',
  type: 'TEXT',
  required: false,
}

const numberEditorField: EditorField = {
  id: 'field-number-1',
  label: 'Edad del operario',
  key: 'edad_operario',
  type: 'NUMBER',
  required: true,
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useFormEditorStore.getState().reset()
  // Carga la sección y los campos en el store
  useFormEditorStore.setState({
    state: {
      ...useFormEditorStore.getState().state,
      sections: [{ id: SECTION_ID, name: 'Test', hasObservations: false, fields: [textEditorField, numberEditorField] }],
    },
  })
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('FieldRow', () => {
  it('renderiza el label del campo en el input editable', () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)
    expect(screen.getByDisplayValue('Nombre completo')).toBeInTheDocument()
  })

  it('renderiza la etiqueta del tipo del campo (Texto para TEXT)', () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('renderiza la etiqueta del tipo NUMBER correctamente', () => {
    renderWithProviders(<FieldRow field={numberEditorField} sectionId={SECTION_ID} />)
    expect(screen.getByText('Número')).toBeInTheDocument()
  })

  it('muestra el indicador de campo requerido cuando required=true', () => {
    renderWithProviders(<FieldRow field={numberEditorField} sectionId={SECTION_ID} />)
    expect(screen.getByLabelText('Campo requerido')).toBeInTheDocument()
  })

  it('muestra el indicador de campo opcional cuando required=false', () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)
    expect(screen.getByLabelText('Campo opcional')).toBeInTheDocument()
  })

  it('al hacer click en el indicador required cambia el estado en el store', async () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)

    const requiredBtn = screen.getByLabelText('Campo opcional')
    await userEvent.click(requiredBtn)

    const updatedField = useFormEditorStore
      .getState()
      .state.sections[0].fields.find((f) => f.id === textEditorField.id)
    expect(updatedField?.required).toBe(true)
  })

  it('al abrir el menú y hacer click en Eliminar remueve el campo del store', async () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)

    // Abrir el menú de opciones
    await userEvent.click(screen.getByLabelText('Opciones del campo'))
    // El menú tiene el botón Eliminar
    await userEvent.click(screen.getByRole('button', { name: /eliminar/i }))

    const remainingFields = useFormEditorStore.getState().state.sections[0].fields
    expect(remainingFields.find((f) => f.id === textEditorField.id)).toBeUndefined()
  })

  it('al abrir el menú y duplicar se agrega una copia del campo', async () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)

    await userEvent.click(screen.getByLabelText('Opciones del campo'))
    await userEvent.click(screen.getByRole('button', { name: /duplicar campo/i }))

    const fields = useFormEditorStore.getState().state.sections[0].fields
    expect(fields.some((f) => f.label.includes('(copia)'))).toBe(true)
  })

  it('al editar el label y perder el foco actualiza el campo en el store', async () => {
    renderWithProviders(<FieldRow field={textEditorField} sectionId={SECTION_ID} />)

    const labelInput = screen.getByLabelText('Nombre del campo')
    await userEvent.clear(labelInput)
    await userEvent.type(labelInput, 'Apellido')
    await userEvent.tab() // dispara onBlur

    const updatedField = useFormEditorStore
      .getState()
      .state.sections[0].fields.find((f) => f.id === textEditorField.id)
    expect(updatedField?.label).toBe('Apellido')
  })
})
