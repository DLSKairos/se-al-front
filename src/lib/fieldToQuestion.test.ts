import { describe, it, expect } from 'vitest'
import { fieldTypeToQuestion, type QuestionType } from './fieldToQuestion'
import type { FieldType } from '@/types'

describe('fieldTypeToQuestion', () => {
  it('should map BOOLEAN to "yesno"', () => {
    expect(fieldTypeToQuestion('BOOLEAN')).toBe<QuestionType>('yesno')
  })

  it('should map SELECT to "multiselect"', () => {
    expect(fieldTypeToQuestion('SELECT')).toBe<QuestionType>('multiselect')
  })

  it('should map MULTISELECT to "multiselect"', () => {
    expect(fieldTypeToQuestion('MULTISELECT')).toBe<QuestionType>('multiselect')
  })

  it('should map TEXT to "text"', () => {
    expect(fieldTypeToQuestion('TEXT')).toBe<QuestionType>('text')
  })

  it('should map NUMBER to "number"', () => {
    expect(fieldTypeToQuestion('NUMBER')).toBe<QuestionType>('number')
  })

  it('should map DATE to "date"', () => {
    expect(fieldTypeToQuestion('DATE')).toBe<QuestionType>('date')
  })

  it('should map DATETIME to "date"', () => {
    expect(fieldTypeToQuestion('DATETIME')).toBe<QuestionType>('date')
  })

  it('should map GEOLOCATION to "geo"', () => {
    expect(fieldTypeToQuestion('GEOLOCATION')).toBe<QuestionType>('geo')
  })

  it('should map SIGNATURE to "signature"', () => {
    expect(fieldTypeToQuestion('SIGNATURE')).toBe<QuestionType>('signature')
  })

  it('should map PHOTO to "photo"', () => {
    expect(fieldTypeToQuestion('PHOTO')).toBe<QuestionType>('photo')
  })

  it('should map FILE to "file"', () => {
    expect(fieldTypeToQuestion('FILE')).toBe<QuestionType>('file')
  })

  it('should cover all FieldType values without falling through to the default', () => {
    const allFieldTypes: FieldType[] = [
      'TEXT', 'NUMBER', 'DATE', 'DATETIME', 'SELECT',
      'MULTISELECT', 'BOOLEAN', 'SIGNATURE', 'PHOTO', 'GEOLOCATION', 'FILE',
    ]

    const validQuestionTypes = new Set<QuestionType>([
      'yesno', 'multiselect', 'text', 'number', 'time', 'date', 'file', 'photo', 'geo', 'signature',
    ])

    allFieldTypes.forEach((type) => {
      const result = fieldTypeToQuestion(type)
      expect(validQuestionTypes.has(result)).toBe(true)
    })
  })
})
