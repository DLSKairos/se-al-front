import { describe, it, expect } from 'vitest'
import { toSnakeCase, FIELD_TYPE_LABELS, ALL_FIELD_TYPES } from './fieldType.utils'
import type { FieldType } from '@/types'

// ── toSnakeCase ───────────────────────────────────────────────────────────────

describe('toSnakeCase', () => {
  it('should convert a two-word string to snake_case', () => {
    expect(toSnakeCase('Nombre Completo')).toBe('nombre_completo')
  })

  it('should remove tildes and normalize accented characters', () => {
    expect(toSnakeCase('Año de Nacimiento')).toBe('ano_de_nacimiento')
  })

  it('should lowercase and strip accents from all-caps accented strings', () => {
    expect(toSnakeCase('MAYÚSCULAS CON TILDE')).toBe('mayusculas_con_tilde')
  })

  it('should lowercase a plain uppercase string', () => {
    expect(toSnakeCase('MAYUSCULAS')).toBe('mayusculas')
  })

  it('should trim leading and trailing whitespace before replacing spaces', () => {
    const result = toSnakeCase('  hola mundo  ')
    expect(result).toBe('hola_mundo')
  })
})

// ── FIELD_TYPE_LABELS ─────────────────────────────────────────────────────────

describe('FIELD_TYPE_LABELS', () => {
  const allFieldTypes: FieldType[] = [
    'TEXT', 'NUMBER', 'DATE', 'DATETIME', 'SELECT',
    'MULTISELECT', 'BOOLEAN', 'SIGNATURE', 'PHOTO', 'GEOLOCATION', 'FILE',
  ]

  it.each(allFieldTypes)(
    'should have a non-empty label for FieldType "%s"',
    (type) => {
      const label = FIELD_TYPE_LABELS[type]
      expect(label).toBeDefined()
      expect(label.length).toBeGreaterThan(0)
    }
  )
})

// ── ALL_FIELD_TYPES ───────────────────────────────────────────────────────────

describe('ALL_FIELD_TYPES', () => {
  it('should be an array', () => {
    expect(Array.isArray(ALL_FIELD_TYPES)).toBe(true)
  })

  it('should not contain duplicate values', () => {
    const unique = new Set(ALL_FIELD_TYPES)
    expect(unique.size).toBe(ALL_FIELD_TYPES.length)
  })

  it('should contain all FieldType values', () => {
    const expected: FieldType[] = [
      'TEXT', 'NUMBER', 'DATE', 'DATETIME', 'SELECT',
      'MULTISELECT', 'BOOLEAN', 'SIGNATURE', 'PHOTO', 'GEOLOCATION', 'FILE',
    ]
    expected.forEach((type) => {
      expect(ALL_FIELD_TYPES).toContain(type)
    })
  })

  it('should only contain valid FieldType values', () => {
    const validSet = new Set<string>([
      'TEXT', 'NUMBER', 'DATE', 'DATETIME', 'SELECT',
      'MULTISELECT', 'BOOLEAN', 'SIGNATURE', 'PHOTO', 'GEOLOCATION', 'FILE',
    ])
    ALL_FIELD_TYPES.forEach((type) => {
      expect(validSet.has(type)).toBe(true)
    })
  })
})
