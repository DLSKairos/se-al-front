import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BooleanField } from './BooleanField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-5',
  template_id: 'template-1',
  order: 5,
  label: 'Esta activo',
  key: 'esta_activo',
  type: 'BOOLEAN',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('BooleanField', () => {
  let onChange: (value: boolean) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (value: boolean) => void
  })

  it('renderiza los botones Si y No', () => {
    render(<BooleanField field={baseField} value={null} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Sí' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })

  it('el grupo tiene el aria-label del campo', () => {
    render(<BooleanField field={baseField} value={null} onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Esta activo' })).toBeInTheDocument()
  })

  it('al hacer click en Si llama onChange con true', async () => {
    const user = userEvent.setup()
    render(<BooleanField field={baseField} value={null} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Sí' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('al hacer click en No llama onChange con false', async () => {
    const user = userEvent.setup()
    render(<BooleanField field={baseField} value={null} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('toggle: Si luego No llama onChange con true y luego false', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<BooleanField field={baseField} value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Sí' }))
    expect(onChange).toHaveBeenNthCalledWith(1, true)

    rerender(<BooleanField field={baseField} value={true} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onChange).toHaveBeenNthCalledWith(2, false)
  })

  it('con value=true el boton Si tiene aria-pressed=true', () => {
    render(<BooleanField field={baseField} value={true} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('con value=false el boton No tiene aria-pressed=true', () => {
    render(<BooleanField field={baseField} value={false} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('con disabled=true los botones estan deshabilitados', () => {
    render(<BooleanField field={baseField} value={null} onChange={onChange} disabled />)
    expect(screen.getByRole('button', { name: 'Sí' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled()
  })

  it('con disabled=true no llama onChange al hacer click', async () => {
    const user = userEvent.setup()
    render(<BooleanField field={baseField} value={null} onChange={onChange} disabled />)
    await user.click(screen.getByRole('button', { name: 'Sí' }))
    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
