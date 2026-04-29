import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextField } from './TextField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-1',
  template_id: 'template-1',
  order: 1,
  label: 'Nombre',
  key: 'nombre',
  type: 'TEXT',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('TextField', () => {
  let onChange: (value: string) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (value: string) => void
  })

  it('renderiza el input con el valor recibido', () => {
    render(<TextField field={baseField} value="hola" onChange={onChange} />)
    const input = screen.getByTestId('field-nombre')
    expect(input).toHaveValue('hola')
  })

  it('llama onChange con el valor correcto al escribir', async () => {
    const user = userEvent.setup()
    render(<TextField field={baseField} value="" onChange={onChange} />)
    const input = screen.getByTestId('field-nombre')
    await user.type(input, 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('usa el placeholder del default_value del campo', () => {
    const field = { ...baseField, default_value: 'Escribe aqui' }
    render(<TextField field={field} value="" onChange={onChange} />)
    expect(screen.getByPlaceholderText('Escribe aqui')).toBeInTheDocument()
  })

  it('con disabled=true el input esta deshabilitado', () => {
    render(<TextField field={baseField} value="" onChange={onChange} disabled />)
    expect(screen.getByTestId('field-nombre')).toBeDisabled()
  })

  it('con disabled=true no llama onChange al intentar escribir', async () => {
    const user = userEvent.setup()
    render(<TextField field={baseField} value="" onChange={onChange} disabled />)
    const input = screen.getByTestId('field-nombre')
    await user.type(input, 'texto')
    expect(onChange).not.toHaveBeenCalled()
  })
})
