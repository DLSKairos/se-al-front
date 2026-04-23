import { FieldType } from '@/types'

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Fecha',
  DATETIME: 'Fecha y hora',
  SELECT: 'Selección única',
  MULTISELECT: 'Selección múltiple',
  BOOLEAN: 'Sí / No',
  SIGNATURE: 'Firma',
  PHOTO: 'Foto',
  GEOLOCATION: 'GPS',
  FILE: 'Archivo',
}

// Nombres de íconos de lucide-react correspondientes a cada tipo
export const FIELD_TYPE_ICON_NAMES: Record<FieldType, string> = {
  TEXT: 'Type',
  NUMBER: 'Hash',
  DATE: 'Calendar',
  DATETIME: 'Clock',
  SELECT: 'ChevronDown',
  MULTISELECT: 'ListChecks',
  BOOLEAN: 'ToggleLeft',
  SIGNATURE: 'PenLine',
  PHOTO: 'Camera',
  GEOLOCATION: 'MapPin',
  FILE: 'Paperclip',
}

export const ALL_FIELD_TYPES: FieldType[] = [
  'TEXT',
  'NUMBER',
  'DATE',
  'DATETIME',
  'SELECT',
  'MULTISELECT',
  'BOOLEAN',
  'SIGNATURE',
  'PHOTO',
  'GEOLOCATION',
  'FILE',
]

/**
 * Convierte un string a snake_case para generar keys de campos.
 * Normaliza acentos, elimina caracteres especiales y reemplaza espacios con _.
 */
export function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}
