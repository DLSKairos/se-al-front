import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelectField } from './MultiSelectField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-6',
  template_id: 'template-1',
  order: 6,
  label: 'Idiomas',
  key: 'idiomas',
  type: 'MULTISELECT',
  required: false,
  default_value: null,
  options: [
    { label: 'Español', value: 'es' },
    { label: 'Ingles', value: 'en' },
    { label: 'Frances', value: 'fr' },
  ],
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('MultiSelectField', () => {
  let onChange: (value: string[]) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (value: string[]) => void
  })

  it('renderiza todas las opciones como checkboxes', () => {
    render(<MultiSelectField field={baseField} value={[]} onChange={onChange} />)
    expect(screen.getByRole('checkbox', { name: 'Español' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Ingles' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Frances' })).toBeInTheDocument()
  })

  it('las opciones en value aparecen marcadas', () => {
    render(<MultiSelectField field={baseField} value={['es', 'fr']} onChange={onChange} />)
    expect(screen.getByRole('checkbox', { name: 'Español' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Frances' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Ingles' })).not.toBeChecked()
  })

  it('seleccionar una opcion llama onChange con el array ampliado', async () => {
    const user = userEvent.setup()
    render(<MultiSelectField field={baseField} value={['es']} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'Ingles' }))
    expect(onChange).toHaveBeenCalledWith(['es', 'en'])
  })

  it('deseleccionar una opcion la elimina del array', async () => {
    const user = userEvent.setup()
    render(<MultiSelectField field={baseField} value={['es', 'en']} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'Español' }))
    expect(onChange).toHaveBeenCalledWith(['en'])
  })

  it('seleccionar multiples opciones desde vacio', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<MultiSelectField field={baseField} value={[]} onChange={onChange} />)

    await user.click(screen.getByRole('checkbox', { name: 'Ingles' }))
    expect(onChange).toHaveBeenNthCalledWith(1, ['en'])

    rerender(<MultiSelectField field={baseField} value={['en']} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox', { name: 'Frances' }))
    expect(onChange).toHaveBeenNthCalledWith(2, ['en', 'fr'])
  })

  it('con disabled=true los checkboxes estan deshabilitados', () => {
    render(<MultiSelectField field={baseField} value={[]} onChange={onChange} disabled />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => expect(cb).toBeDisabled())
  })

  it('con disabled=true no llama onChange al hacer click', async () => {
    const user = userEvent.setup()
    render(<MultiSelectField field={baseField} value={[]} onChange={onChange} disabled />)
    await user.click(screen.getByRole('checkbox', { name: 'Español' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('con options null no renderiza opciones', () => {
    const fieldSinOpciones = { ...baseField, options: null }
    render(<MultiSelectField field={fieldSinOpciones} value={[]} onChange={onChange} />)
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })
})
