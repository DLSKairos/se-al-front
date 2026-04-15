import { FieldType } from '@/types'

export type QuestionType =
  | 'yesno'
  | 'multiselect'
  | 'text'
  | 'number'
  | 'time'
  | 'date'
  | 'file'
  | 'photo'
  | 'geo'
  | 'signature'

export function fieldTypeToQuestion(type: FieldType): QuestionType {
  const map: Record<FieldType, QuestionType> = {
    BOOLEAN:     'yesno',
    SELECT:      'multiselect',
    MULTISELECT: 'multiselect',
    TEXT:        'text',
    NUMBER:      'number',
    DATE:        'date',
    DATETIME:    'date',
    GEOLOCATION: 'geo',
    SIGNATURE:   'signature',
    PHOTO:       'photo',
    FILE:        'file',
  }
  return map[type] ?? 'text'
}
