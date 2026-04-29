import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormField } from '@/types'

// jsdom no implementa ResizeObserver; lo mockeamos globalmente para este archivo
globalThis.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Instancia compartida del mock de SignaturePad para poder espiar sus metodos
let mockPadInstance = {
  isEmpty: vi.fn(() => true),
  clear: vi.fn(),
  toDataURL: vi.fn(() => 'data:image/png;base64,abc123'),
  fromDataURL: vi.fn(),
  off: vi.fn(),
  addEventListener: vi.fn(),
}

// El mock debe ser una clase (constructor) para que `new SignaturePad(...)` funcione
vi.mock('signature_pad', () => {
  class SignaturePadMock {
    isEmpty = vi.fn(() => true)
    clear = vi.fn()
    toDataURL = vi.fn(() => 'data:image/png;base64,abc123')
    fromDataURL = vi.fn()
    off = vi.fn()
    addEventListener = vi.fn()
  }
  return { default: SignaturePadMock }
})

import { SignatureField } from './SignatureField'

const baseField: FormField = {
  id: 'field-7',
  template_id: 'template-1',
  order: 7,
  label: 'Firma del empleado',
  key: 'firma',
  type: 'SIGNATURE',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('SignatureField', () => {
  let onChange: (dataURL: string) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (dataURL: string) => void
    mockPadInstance = {
      isEmpty: vi.fn(() => true),
      clear: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,abc123'),
      fromDataURL: vi.fn(),
      off: vi.fn(),
      addEventListener: vi.fn(),
    }
  })

  it('se renderiza sin crash', () => {
    render(<SignatureField field={baseField} value="" onChange={onChange} />)
    expect(screen.getByTestId('field-firma')).toBeInTheDocument()
  })

  it('renderiza un elemento canvas en el DOM', () => {
    render(<SignatureField field={baseField} value="" onChange={onChange} />)
    const canvas = screen.getByLabelText(`Campo de firma: ${baseField.label}`)
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
  })

  it('el canvas tiene el aria-label correcto', () => {
    render(<SignatureField field={baseField} value="" onChange={onChange} />)
    const canvas = screen.getByLabelText('Campo de firma: Firma del empleado')
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
  })

  it('muestra el mensaje de firma cuando esta vacio y no esta deshabilitado', () => {
    render(<SignatureField field={baseField} value="" onChange={onChange} />)
    expect(screen.getByText('Firma aqui')).toBeInTheDocument()
  })

  it('no muestra el boton limpiar cuando no hay firma', () => {
    render(<SignatureField field={baseField} value="" onChange={onChange} />)
    expect(screen.queryByRole('button', { name: /limpiar firma/i })).not.toBeInTheDocument()
  })

  it('con disabled=true no muestra el hint de firma', () => {
    render(<SignatureField field={baseField} value="" onChange={onChange} disabled />)
    // Condicion en el componente: isEmpty && !disabled → no se muestra con disabled
    expect(screen.queryByText('Firma aqui')).not.toBeInTheDocument()
  })

  it('con value previo no muestra el hint de firma vacia', () => {
    // Cuando hay value, isEmpty=false en el estado inicial del componente
    render(
      <SignatureField
        field={baseField}
        value="data:image/png;base64,existente"
        onChange={onChange}
      />
    )
    expect(screen.queryByText('Firma aqui')).not.toBeInTheDocument()
  })

  it('con value previo muestra el boton limpiar firma', () => {
    // El estado interno isEmpty se inicializa como !value → false cuando hay value
    render(
      <SignatureField
        field={baseField}
        value="data:image/png;base64,existente"
        onChange={onChange}
      />
    )
    expect(screen.getByRole('button', { name: /limpiar firma/i })).toBeInTheDocument()
  })

  it('al hacer click en limpiar firma llama onChange con string vacio', async () => {
    const user = userEvent.setup()
    render(
      <SignatureField
        field={baseField}
        value="data:image/png;base64,existente"
        onChange={onChange}
      />
    )

    const botonLimpiar = screen.getByRole('button', { name: /limpiar firma/i })
    await user.click(botonLimpiar)

    expect(onChange).toHaveBeenCalledWith('')
  })
})
