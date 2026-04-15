import { FormField } from '@/types'
import { TextField }       from './fields/TextField'
import { NumberField }     from './fields/NumberField'
import { DateField }       from './fields/DateField'
import { SelectField }     from './fields/SelectField'
import { MultiSelectField } from './fields/MultiSelectField'
import { BooleanField }    from './fields/BooleanField'
import { SignatureField }  from './fields/SignatureField'
import { PhotoField }      from './fields/PhotoField'
import { FileField }       from './fields/FileField'

interface DynamicFormProps {
  fields: FormField[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  disabled?: boolean
}

export function DynamicForm({ fields, values, onChange, disabled }: DynamicFormProps) {
  const sortedFields = [...fields]
    .filter((f) => f.type !== 'GEOLOCATION')
    .sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-6">
      {sortedFields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <label
            htmlFor={`field-${field.id}`}
            className="text-sm font-medium text-[var(--off-white)] font-['DM_Sans']"
          >
            {field.label}
            {field.required && (
              <span className="ml-1 text-[var(--signal)]" aria-hidden="true">
                *
              </span>
            )}
          </label>

          <FieldRenderer
            field={field}
            values={values}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  )
}

// ── Selector de campo ─────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: FormField
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  disabled?: boolean
}

function FieldRenderer({ field, values, onChange, disabled }: FieldRendererProps) {
  const rawValue = values[field.key]

  switch (field.type) {
    case 'TEXT':
    case 'DATETIME':
      return (
        <TextField
          field={field}
          value={(rawValue as string) ?? ''}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'NUMBER':
      return (
        <NumberField
          field={field}
          value={(rawValue as number | '') ?? ''}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'DATE':
      return (
        <DateField
          field={field}
          value={(rawValue as string) ?? ''}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'SELECT':
      return (
        <SelectField
          field={field}
          value={(rawValue as string) ?? ''}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'MULTISELECT':
      return (
        <MultiSelectField
          field={field}
          value={(rawValue as string[]) ?? []}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'BOOLEAN':
      return (
        <BooleanField
          field={field}
          value={rawValue === undefined ? null : (rawValue as boolean)}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'SIGNATURE':
      return (
        <SignatureField
          field={field}
          value={(rawValue as string) ?? ''}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'PHOTO':
      return (
        <PhotoField
          field={field}
          value={(rawValue as File | null) ?? null}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    case 'FILE':
      return (
        <FileField
          field={field}
          value={(rawValue as File | null) ?? null}
          onChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        />
      )

    default:
      return (
        <p className="text-xs text-[var(--muted)] font-['DM_Sans'] italic">
          Tipo de campo no soportado: {field.type}
        </p>
      )
  }
}
