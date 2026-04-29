import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberField } from './NumberField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-2',
  template_id: 'template-1',
  order: 2,
  label: 'Cantidad',
  key: 'cantidad',
  type: 'NUMBER',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('NumberField', () => {
  let onChange: (value: number | '') => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (value: number | '') => void
  })

  it('renderiza el input de tipo number', () => {
    render(<NumberField field={baseField} value="" onChange={onChange} />)
    const input = screen.getByTestId('field-cantidad')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('muestra el valor numerico recibido', () => {
    render(<NumberField field={baseField} value={42} onChange={onChange} />)
    expect(screen.getByTestId('field-cantidad')).toHaveValue(42)
  })

  it('llama onChange con numero al escribir un valor', async () => {
    const user = userEvent.setup()
    render(<NumberField field={baseField} value="" onChange={onChange} />)
    const input = screen.getByTestId('field-cantidad')
    await user.type(input, '5')
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('llama onChange con string vacio cuando se borra el contenido', async () => {
    const user = userEvent.setup()
    render(<NumberField field={baseField} value={3} onChange={onChange} />)
    const input = screen.getByTestId('field-cantidad')
    await user.clear(input)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('con disabled=true el input esta deshabilitado', () => {
    render(<NumberField field={baseField} value="" onChange={onChange} disabled />)
    expect(screen.getByTestId('field-cantidad')).toBeDisabled()
  })

  it('con disabled=true no llama onChange', async () => {
    const user = userEvent.setup()
    render(<NumberField field={baseField} value="" onChange={onChange} disabled />)
    await user.type(screen.getByTestId('field-cantidad'), '9')
    expect(onChange).not.toHaveBeenCalled()
  })
})
