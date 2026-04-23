import { create } from 'zustand'
import { EditorState, EditorSection, EditorField } from '@/types'

const DEFAULT_SECTION = (): EditorSection => ({
  id: crypto.randomUUID(),
  name: 'General',
  hasObservations: false,
  fields: [],
})

const DEFAULT_STATE: EditorState = {
  name: '',
  categoryId: '',
  columns: 1,
  sections: [DEFAULT_SECTION()],
  isDirty: false,
  status: 'DRAFT',
}

interface FormEditorStore {
  state: EditorState
  setInitialState: (partial: Partial<EditorState>) => void
  reset: () => void
  setName: (name: string) => void
  setColumns: (columns: 1 | 2 | 3) => void
  setCategoryId: (id: string) => void
  setStatus: (status: 'DRAFT' | 'ACTIVE') => void
  addSection: () => void
  updateSection: (sectionId: string, updates: Partial<Omit<EditorSection, 'fields'>>) => void
  removeSection: (sectionId: string) => void
  reorderSections: (fromIndex: number, toIndex: number) => void
  addField: (sectionId: string, field?: Partial<EditorField>) => void
  updateField: (sectionId: string, fieldId: string, updates: Partial<EditorField>) => void
  removeField: (sectionId: string, fieldId: string) => void
  moveField: (fromSectionId: string, toSectionId: string, fromIndex: number, toIndex: number) => void
  reorderFieldsInSection: (sectionId: string, fromIndex: number, toIndex: number) => void
  applySectionsFromAI: (sections: EditorSection[]) => void
  markDirty: () => void
}

export const useFormEditorStore = create<FormEditorStore>((set, get) => ({
  state: { ...DEFAULT_STATE },

  setInitialState: (partial) =>
    set({ state: { ...DEFAULT_STATE, ...partial, isDirty: false } }),

  reset: () => set({ state: { ...DEFAULT_STATE, sections: [DEFAULT_SECTION()] } }),

  setName: (name) =>
    set((s) => ({ state: { ...s.state, name, isDirty: true } })),

  setColumns: (columns) =>
    set((s) => ({ state: { ...s.state, columns, isDirty: true } })),

  setCategoryId: (categoryId) =>
    set((s) => ({ state: { ...s.state, categoryId, isDirty: true } })),

  setStatus: (status) =>
    set((s) => ({ state: { ...s.state, status, isDirty: true } })),

  addSection: () =>
    set((s) => ({
      state: {
        ...s.state,
        sections: [...s.state.sections, DEFAULT_SECTION()],
        isDirty: true,
      },
    })),

  updateSection: (sectionId, updates) =>
    set((s) => ({
      state: {
        ...s.state,
        sections: s.state.sections.map((sec) =>
          sec.id === sectionId ? { ...sec, ...updates } : sec
        ),
        isDirty: true,
      },
    })),

  removeSection: (sectionId) =>
    set((s) => ({
      state: {
        ...s.state,
        sections: s.state.sections.filter((sec) => sec.id !== sectionId),
        isDirty: true,
      },
    })),

  reorderSections: (fromIndex, toIndex) =>
    set((s) => {
      const sections = [...s.state.sections]
      const [moved] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, moved)
      return { state: { ...s.state, sections, isDirty: true } }
    }),

  addField: (sectionId, field = {}) =>
    set((s) => {
      const newField: EditorField = {
        id: crypto.randomUUID(),
        label: field.label ?? 'Nuevo campo',
        key: field.key ?? `campo_${Date.now()}`,
        type: field.type ?? 'TEXT',
        required: field.required ?? false,
        options: field.options,
        placeholder: field.placeholder,
        helpText: field.helpText,
        defaultValue: field.defaultValue,
      }
      return {
        state: {
          ...s.state,
          sections: s.state.sections.map((sec) =>
            sec.id === sectionId
              ? { ...sec, fields: [...sec.fields, newField] }
              : sec
          ),
          isDirty: true,
        },
      }
    }),

  updateField: (sectionId, fieldId, updates) =>
    set((s) => ({
      state: {
        ...s.state,
        sections: s.state.sections.map((sec) =>
          sec.id === sectionId
            ? {
                ...sec,
                fields: sec.fields.map((f) =>
                  f.id === fieldId ? { ...f, ...updates } : f
                ),
              }
            : sec
        ),
        isDirty: true,
      },
    })),

  removeField: (sectionId, fieldId) =>
    set((s) => ({
      state: {
        ...s.state,
        sections: s.state.sections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, fields: sec.fields.filter((f) => f.id !== fieldId) }
            : sec
        ),
        isDirty: true,
      },
    })),

  moveField: (fromSectionId, toSectionId, fromIndex, toIndex) =>
    set((s) => {
      const sections = s.state.sections.map((sec) => ({ ...sec, fields: [...sec.fields] }))
      const fromSec = sections.find((sec) => sec.id === fromSectionId)
      const toSec = sections.find((sec) => sec.id === toSectionId)
      if (!fromSec || !toSec) return { state: s.state }
      const [moved] = fromSec.fields.splice(fromIndex, 1)
      toSec.fields.splice(toIndex, 0, moved)
      return { state: { ...s.state, sections, isDirty: true } }
    }),

  reorderFieldsInSection: (sectionId, fromIndex, toIndex) =>
    set((s) => ({
      state: {
        ...s.state,
        sections: s.state.sections.map((sec) => {
          if (sec.id !== sectionId) return sec
          const fields = [...sec.fields]
          const [moved] = fields.splice(fromIndex, 1)
          fields.splice(toIndex, 0, moved)
          return { ...sec, fields }
        }),
        isDirty: true,
      },
    })),

  applySectionsFromAI: (sections) =>
    set((s) => ({
      state: { ...s.state, sections, isDirty: true },
    })),

  markDirty: () => set((s) => ({ state: { ...s.state, isDirty: true } })),
}))

// Permite acceder al store fuera de componentes React
export const getFormEditorState = () => useFormEditorStore.getState()
