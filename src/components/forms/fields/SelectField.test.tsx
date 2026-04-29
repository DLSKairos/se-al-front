import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectField } from './SelectField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-4',
  template_id: 'template-1',
  order: 4,
  label: 'Estado',
  key: 'estado',
  type: 'SELECT',
  required: false,
  default_value: null,
  options: [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Pendiente', value: 'pendiente' },
  ],
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('SelectField', () => {
  let onChange: (value: string) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (value: string) => void
  })

  it('renderiza el select con la opcion por defecto', () => {
    render(<SelectField field={baseField} value="" onChange={onChange} />)
    expect(screen.getByTestId('field-estado')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('muestra todas las opciones del campo', () => {
    render(<SelectField field={baseField} value="" onChange={onChange} />)
    expect(screen.getByRole('option', { name: 'Activo' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Inactivo' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Pendiente' })).toBeInTheDocument()
  })

  it('muestra el valor seleccionado cuando se recibe un value', () => {
    render(<SelectField field={baseField} value="inactivo" onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveValue('inactivo')
  })

  it('llama onChange con el valor correcto al seleccionar una opcion', () => {
    render(<SelectField field={baseField} value="" onChange={onChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'activo' } })
    expect(onChange).toHaveBeenCalledWith('activo')
  })

  it('con disabled=true el select esta deshabilitado', () => {
    render(<SelectField field={baseField} value="" onChange={onChange} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('con disabled=true el select no permite interaccion del usuario', () => {
    render(<SelectField field={baseField} value="" onChange={onChange} disabled />)
    const select = screen.getByRole('combobox')
    // Verificar que esta deshabilitado (el navegador impide la interaccion)
    expect(select).toBeDisabled()
    expect(select).toHaveAttribute('disabled')
  })

  it('con options null renderiza solo la opcion por defecto', () => {
    const fieldSinOpciones = { ...baseField, options: null }
    render(<SelectField field={fieldSinOpciones} value="" onChange={onChange} />)
    const opciones = screen.getAllByRole('option')
    expect(opciones).toHaveLength(1)
    expect(opciones[0]).toHaveTextContent('Seleccionar...')
  })
})
