import { describe, it, expect, beforeEach } from 'vitest'
import { useFormEditorStore } from './formEditorStore'
import type { EditorSection, EditorField } from '@/types'

function getStore() {
  return useFormEditorStore.getState()
}

function getState() {
  return useFormEditorStore.getState().state
}

describe('formEditorStore', () => {
  beforeEach(() => {
    getStore().reset()
  })

  // ── Estado inicial ──────────────────────────────────────────────────────────

  describe('estado inicial (después de reset)', () => {
    it('sections tiene exactamente una sección por defecto', () => {
      // reset() inicializa con DEFAULT_SECTION()
      expect(getState().sections).toHaveLength(1)
    })

    it('isDirty es false', () => {
      expect(getState().isDirty).toBe(false)
    })

    it('name es string vacío', () => {
      expect(getState().name).toBe('')
    })

    it('categoryId es string vacío', () => {
      expect(getState().categoryId).toBe('')
    })
  })

  // ── addSection ──────────────────────────────────────────────────────────────

  describe('addSection()', () => {
    it('agrega una sección al array', () => {
      const initialCount = getState().sections.length
      getStore().addSection()
      expect(getState().sections).toHaveLength(initialCount + 1)
    })

    it('las secciones creadas en llamadas distintas tienen IDs únicos', () => {
      getStore().addSection()
      getStore().addSection()
      const sections = getState().sections
      const ids = sections.map((s) => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('marca isDirty como true', () => {
      getStore().addSection()
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── removeSection ───────────────────────────────────────────────────────────

  describe('removeSection(id)', () => {
    it('elimina la sección con el ID indicado', () => {
      getStore().addSection()
      const sectionToRemove = getState().sections[1]
      getStore().removeSection(sectionToRemove.id)
      const ids = getState().sections.map((s) => s.id)
      expect(ids).not.toContain(sectionToRemove.id)
    })

    it('no modifica el array si el ID no existe', () => {
      const countBefore = getState().sections.length
      getStore().removeSection('id-que-no-existe')
      expect(getState().sections).toHaveLength(countBefore)
    })

    it('marca isDirty como true', () => {
      const sectionId = getState().sections[0].id
      getStore().removeSection(sectionId)
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── updateSection ───────────────────────────────────────────────────────────

  describe('updateSection(id, updates)', () => {
    it('actualiza el nombre de la sección', () => {
      const sectionId = getState().sections[0].id
      getStore().updateSection(sectionId, { name: 'Sección Renombrada' })
      const section = getState().sections.find((s) => s.id === sectionId)
      expect(section?.name).toBe('Sección Renombrada')
    })

    it('no afecta los campos existentes de la sección', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId, { label: 'Campo original' })
      const fieldsBefore = getState().sections[0].fields.length

      getStore().updateSection(sectionId, { name: 'Nuevo nombre' })

      expect(getState().sections[0].fields).toHaveLength(fieldsBefore)
    })

    it('marca isDirty como true', () => {
      const sectionId = getState().sections[0].id
      getStore().updateSection(sectionId, { name: 'X' })
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── reorderSections ─────────────────────────────────────────────────────────

  describe('reorderSections(fromIndex, toIndex)', () => {
    it('mueve una sección de la posición fromIndex a toIndex', () => {
      // Preparar: sección default + 2 adicionales
      getStore().addSection()
      getStore().addSection()
      const sections = getState().sections
      const idAtIndex0 = sections[0].id
      const idAtIndex1 = sections[1].id

      // Mover la sección en índice 0 al índice 1
      getStore().reorderSections(0, 1)

      const reordered = getState().sections
      expect(reordered[0].id).toBe(idAtIndex1)
      expect(reordered[1].id).toBe(idAtIndex0)
    })

    it('marca isDirty como true', () => {
      getStore().addSection()
      getStore().reorderSections(0, 1)
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── addField ────────────────────────────────────────────────────────────────

  describe('addField(sectionId, field)', () => {
    it('agrega el campo a la sección indicada', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId, { label: 'Nombre del operario' })
      const fields = getState().sections[0].fields
      expect(fields).toHaveLength(1)
      expect(fields[0].label).toBe('Nombre del operario')
    })

    it('no afecta campos de otras secciones', () => {
      getStore().addSection()
      const sections = getState().sections
      const firstId = sections[0].id
      const secondId = sections[1].id

      getStore().addField(firstId, { label: 'Solo en primera' })

      const secondFields = getState().sections.find((s) => s.id === secondId)?.fields
      expect(secondFields).toHaveLength(0)
    })

    it('asigna un ID único al campo', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId)
      getStore().addField(sectionId)
      const fieldIds = getState().sections[0].fields.map((f) => f.id)
      const uniqueIds = new Set(fieldIds)
      expect(uniqueIds.size).toBe(fieldIds.length)
    })

    it('marca isDirty como true', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId)
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── removeField ─────────────────────────────────────────────────────────────

  describe('removeField(sectionId, fieldId)', () => {
    it('elimina el campo específico', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId, { label: 'Campo A' })
      getStore().addField(sectionId, { label: 'Campo B' })
      const fieldToRemove = getState().sections[0].fields[0]

      getStore().removeField(sectionId, fieldToRemove.id)

      const remainingIds = getState().sections[0].fields.map((f) => f.id)
      expect(remainingIds).not.toContain(fieldToRemove.id)
    })

    it('no elimina otros campos de la misma sección', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId, { label: 'Queda' })
      getStore().addField(sectionId, { label: 'Se elimina' })
      const [staying, removing] = getState().sections[0].fields

      getStore().removeField(sectionId, removing.id)

      expect(getState().sections[0].fields[0].id).toBe(staying.id)
    })

    it('no afecta campos de otras secciones', () => {
      getStore().addSection()
      const [sec1, sec2] = getState().sections
      getStore().addField(sec1.id, { label: 'En sec1' })
      getStore().addField(sec2.id, { label: 'En sec2' })
      const fieldInSec1 = getState().sections[0].fields[0]

      getStore().removeField(sec1.id, fieldInSec1.id)

      expect(getState().sections[1].fields).toHaveLength(1)
    })

    it('marca isDirty como true', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId)
      const fieldId = getState().sections[0].fields[0].id
      getStore().removeField(sectionId, fieldId)
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── updateField ─────────────────────────────────────────────────────────────

  describe('updateField(sectionId, fieldId, changes)', () => {
    it('actualiza solo los props indicados', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId, { label: 'Original', type: 'TEXT', required: false })
      const fieldId = getState().sections[0].fields[0].id

      getStore().updateField(sectionId, fieldId, { label: 'Actualizado' })

      const field = getState().sections[0].fields[0]
      expect(field.label).toBe('Actualizado')
      expect(field.type).toBe('TEXT')
      expect(field.required).toBe(false)
    })

    it('no modifica campos adyacentes de la misma sección', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId, { label: 'Campo 1' })
      getStore().addField(sectionId, { label: 'Campo 2' })
      const [field1, field2] = getState().sections[0].fields

      getStore().updateField(sectionId, field1.id, { label: 'Campo 1 modificado' })

      expect(getState().sections[0].fields[1].label).toBe(field2.label)
    })

    it('marca isDirty como true', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId)
      const fieldId = getState().sections[0].fields[0].id
      getStore().updateField(sectionId, fieldId, { required: true })
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── moveField ───────────────────────────────────────────────────────────────

  describe('moveField(fromSectionId, toSectionId, fromIndex, toIndex)', () => {
    it('el campo aparece en la sección destino', () => {
      getStore().addSection()
      const [sec1, sec2] = getState().sections
      getStore().addField(sec1.id, { label: 'Campo a mover' })
      const fieldId = getState().sections[0].fields[0].id

      getStore().moveField(sec1.id, sec2.id, 0, 0)

      const destFields = getState().sections.find((s) => s.id === sec2.id)?.fields
      expect(destFields?.map((f) => f.id)).toContain(fieldId)
    })

    it('el campo desaparece de la sección origen', () => {
      getStore().addSection()
      const [sec1, sec2] = getState().sections
      getStore().addField(sec1.id, { label: 'Campo a mover' })
      const fieldId = getState().sections[0].fields[0].id

      getStore().moveField(sec1.id, sec2.id, 0, 0)

      const originFields = getState().sections.find((s) => s.id === sec1.id)?.fields
      expect(originFields?.map((f) => f.id)).not.toContain(fieldId)
    })

    it('marca isDirty como true', () => {
      getStore().addSection()
      const [sec1, sec2] = getState().sections
      getStore().addField(sec1.id)

      getStore().moveField(sec1.id, sec2.id, 0, 0)

      expect(getState().isDirty).toBe(true)
    })
  })

  // ── applySectionsFromAI ─────────────────────────────────────────────────────

  describe('applySectionsFromAI(sections)', () => {
    it('reemplaza las secciones del store con las proporcionadas por IA', () => {
      const aiSections: EditorSection[] = [
        {
          id: 'ai-sec-1',
          name: 'Sección IA',
          hasObservations: false,
          fields: [
            {
              id: 'ai-field-1',
              label: 'Campo IA',
              key: 'campo_ia',
              type: 'TEXT',
              required: true,
            },
          ],
        },
      ]

      getStore().applySectionsFromAI(aiSections)

      expect(getState().sections).toHaveLength(1)
      expect(getState().sections[0].id).toBe('ai-sec-1')
      expect(getState().sections[0].name).toBe('Sección IA')
    })

    it('isDirty pasa a true después de applySectionsFromAI', () => {
      getStore().applySectionsFromAI([])
      expect(getState().isDirty).toBe(true)
    })
  })

  // ── reset ───────────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('isDirty vuelve a false', () => {
      getStore().addSection()
      expect(getState().isDirty).toBe(true)

      getStore().reset()

      expect(getState().isDirty).toBe(false)
    })

    it('sections vuelve a tener una sola sección por defecto', () => {
      getStore().addSection()
      getStore().addSection()
      expect(getState().sections.length).toBeGreaterThan(1)

      getStore().reset()

      expect(getState().sections).toHaveLength(1)
    })

    it('name vuelve a string vacío', () => {
      getStore().setName('Formulario de inspección')
      getStore().reset()
      expect(getState().name).toBe('')
    })
  })

  // ── isDirty ─────────────────────────────────────────────────────────────────

  describe('isDirty', () => {
    it('es false en estado inicial', () => {
      expect(getState().isDirty).toBe(false)
    })

    it('es true después de addSection()', () => {
      getStore().addSection()
      expect(getState().isDirty).toBe(true)
    })

    it('es true después de addField()', () => {
      const sectionId = getState().sections[0].id
      getStore().addField(sectionId)
      expect(getState().isDirty).toBe(true)
    })

    it('vuelve a false después de reset()', () => {
      getStore().addSection()
      getStore().reset()
      expect(getState().isDirty).toBe(false)
    })
  })
})
