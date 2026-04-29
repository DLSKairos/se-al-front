import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DateField } from './DateField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-3',
  template_id: 'template-1',
  order: 3,
  label: 'Fecha de nacimiento',
  key: 'fecha_nacimiento',
  type: 'DATE',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('DateField', () => {
  let onChange: (value: string) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (value: string) => void
  })

  it('renderiza el input de tipo date', () => {
    render(<DateField field={baseField} value="" onChange={onChange} />)
    const input = screen.getByTestId('field-fecha_nacimiento')
    expect(input).toHaveAttribute('type', 'date')
  })

  it('muestra el valor de fecha recibido', () => {
    render(<DateField field={baseField} value="2024-01-15" onChange={onChange} />)
    expect(screen.getByTestId('field-fecha_nacimiento')).toHaveValue('2024-01-15')
  })

  it('llama onChange con el valor correcto al cambiar la fecha', () => {
    render(<DateField field={baseField} value="" onChange={onChange} />)
    const input = screen.getByTestId('field-fecha_nacimiento')
    fireEvent.change(input, { target: { value: '2024-06-20' } })
    expect(onChange).toHaveBeenCalledWith('2024-06-20')
  })

  it('con disabled=true el input esta deshabilitado', () => {
    render(<DateField field={baseField} value="" onChange={onChange} disabled />)
    expect(screen.getByTestId('field-fecha_nacimiento')).toBeDisabled()
  })

  it('con disabled=true el input tiene atributo disabled', () => {
    render(<DateField field={baseField} value="" onChange={onChange} disabled />)
    const input = screen.getByTestId('field-fecha_nacimiento')
    expect(input).toBeDisabled()
  })
})
