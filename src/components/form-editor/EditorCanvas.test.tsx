import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { EditorCanvas } from './EditorCanvas'
import { useFormEditorStore } from '@/stores/formEditorStore'

// ── Mock DnD Kit — jsdom no soporta PointerEvents del nivel que DnD Kit necesita
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
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  useFormEditorStore.getState().reset()
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('EditorCanvas', () => {
  it('siempre muestra el botón "Agregar sección"', () => {
    // El store en estado inicial tiene 1 sección; lo vaciamos manualmente
    useFormEditorStore.setState({ state: { ...useFormEditorStore.getState().state, sections: [] } })
    renderWithProviders(<EditorCanvas />)
    expect(screen.getByRole('button', { name: /agregar nueva sección/i })).toBeInTheDocument()
  })

  it('cuando el store tiene 0 secciones no renderiza ningún bloque de sección', () => {
    useFormEditorStore.setState({ state: { ...useFormEditorStore.getState().state, sections: [] } })
    renderWithProviders(<EditorCanvas />)
    // No debe existir ningún input con aria-label "Nombre de la sección"
    expect(screen.queryByLabelText(/nombre de la sección/i)).not.toBeInTheDocument()
  })

  it('cuando el store tiene 1 sección renderiza el nombre de esa sección', () => {
    useFormEditorStore.setState({
      state: {
        ...useFormEditorStore.getState().state,
        sections: [{ id: 'sec-1', name: 'Información General', hasObservations: false, fields: [] }],
      },
    })
    renderWithProviders(<EditorCanvas />)
    const input = screen.getByDisplayValue('Información General')
    expect(input).toBeInTheDocument()
  })

  it('cuando el store tiene 2 secciones renderiza ambas', () => {
    useFormEditorStore.setState({
      state: {
        ...useFormEditorStore.getState().state,
        sections: [
          { id: 'sec-1', name: 'Sección Alpha', hasObservations: false, fields: [] },
          { id: 'sec-2', name: 'Sección Beta', hasObservations: false, fields: [] },
        ],
      },
    })
    renderWithProviders(<EditorCanvas />)
    expect(screen.getByDisplayValue('Sección Alpha')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Sección Beta')).toBeInTheDocument()
  })

  it('al hacer click en "Agregar sección" se añade una sección nueva al store', async () => {
    useFormEditorStore.setState({ state: { ...useFormEditorStore.getState().state, sections: [] } })
    renderWithProviders(<EditorCanvas />)

    const before = useFormEditorStore.getState().state.sections.length
    await userEvent.click(screen.getByRole('button', { name: /agregar nueva sección/i }))
    const after = useFormEditorStore.getState().state.sections.length

    expect(after).toBe(before + 1)
  })
})
