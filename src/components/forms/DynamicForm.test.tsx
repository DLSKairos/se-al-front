import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DynamicForm } from './DynamicForm'
import { FormField } from '@/types'

// ── Helpers de fixtures ────────────────────────────────────────────────────────

function makeField(overrides: Partial<FormField> & Pick<FormField, 'id' | 'key' | 'type'>): FormField {
  return {
    template_id: 'tpl-1',
    order: 0,
    label: 'Campo de prueba',
    required: false,
    default_value: null,
    options: null,
    validations: null,
    revalidation_frequency: 'NONE',
    ...overrides,
  }
}

const textField = makeField({ id: '1', key: 'nombre', type: 'TEXT', label: 'Nombre', required: true, order: 1 })
const booleanField = makeField({ id: '2', key: 'activo', type: 'BOOLEAN', label: 'Activo', order: 2 })
const numberField = makeField({ id: '3', key: 'edad', type: 'NUMBER', label: 'Edad', order: 3 })
const geoField = makeField({ id: '4', key: 'ubicacion', type: 'GEOLOCATION', label: 'Ubicación', order: 4 })

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('DynamicForm', () => {
  it('renderiza el contenedor raíz con data-testid="dynamic-form"', () => {
    render(<DynamicForm fields={[textField]} values={{}} onChange={vi.fn()} />)
    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument()
  })

  it('renderiza el número correcto de campos visibles', () => {
    render(
      <DynamicForm
        fields={[textField, booleanField, numberField]}
        values={{}}
        onChange={vi.fn()}
      />
    )
    // Cada campo visible tiene su propio testid
    expect(screen.getByTestId('field-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('field-activo')).toBeInTheDocument()
    expect(screen.getByTestId('field-edad')).toBeInTheDocument()
  })

  it('filtra campos GEOLOCATION y no los renderiza', () => {
    render(
      <DynamicForm
        fields={[textField, geoField]}
        values={{}}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('field-nombre')).toBeInTheDocument()
    expect(screen.queryByTestId('field-ubicacion')).not.toBeInTheDocument()
  })

  it('campo con type TEXT renderiza un TextField con el testid correcto', () => {
    render(<DynamicForm fields={[textField]} values={{}} onChange={vi.fn()} />)
    const input = screen.getByTestId('field-nombre')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('campo con type BOOLEAN renderiza un BooleanField con botones Sí / No', () => {
    render(<DynamicForm fields={[booleanField]} values={{}} onChange={vi.fn()} />)
    expect(screen.getByTestId('field-activo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sí/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('muestra el asterisco de requerido cuando required es true', () => {
    render(<DynamicForm fields={[textField]} values={{}} onChange={vi.fn()} />)
    // El asterisco tiene aria-hidden, buscamos el label que lo contiene
    const label = screen.getByText((_, element) => {
      return element?.tagName === 'LABEL' && element.textContent?.includes('Nombre') === true
    })
    expect(label).toBeInTheDocument()
    // Verifica que el span con * esté dentro del label
    const asterisk = label.querySelector('span[aria-hidden="true"]')
    expect(asterisk).toBeInTheDocument()
    expect(asterisk?.textContent).toBe('*')
  })

  it('no muestra asterisco de requerido cuando required es false', () => {
    render(<DynamicForm fields={[booleanField]} values={{}} onChange={vi.fn()} />)
    const label = screen.getByText((_, element) => {
      return element?.tagName === 'LABEL' && element.textContent?.includes('Activo') === true
    })
    const asterisk = label.querySelector('span[aria-hidden="true"]')
    expect(asterisk).not.toBeInTheDocument()
  })

  it('pasa el valor inicial al campo correspondiente', () => {
    render(
      <DynamicForm
        fields={[textField]}
        values={{ nombre: 'Juan Pérez' }}
        onChange={vi.fn()}
      />
    )
    const input = screen.getByTestId('field-nombre') as HTMLInputElement
    expect(input.value).toBe('Juan Pérez')
  })

  it('llama a onChange con la key y el nuevo valor cuando el usuario escribe', async () => {
    const onChange = vi.fn()
    render(<DynamicForm fields={[textField]} values={{}} onChange={onChange} />)
    const input = screen.getByTestId('field-nombre')
    await userEvent.type(input, 'A')
    expect(onChange).toHaveBeenCalledWith('nombre', 'A')
  })

  it('deshabilita los campos cuando disabled=true', () => {
    render(<DynamicForm fields={[textField]} values={{}} onChange={vi.fn()} disabled />)
    const input = screen.getByTestId('field-nombre') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('ordena los campos por su propiedad order', () => {
    const fieldA = makeField({ id: 'a', key: 'campo_a', type: 'TEXT', label: 'Campo A', order: 2 })
    const fieldB = makeField({ id: 'b', key: 'campo_b', type: 'TEXT', label: 'Campo B', order: 1 })
    render(<DynamicForm fields={[fieldA, fieldB]} values={{}} onChange={vi.fn()} />)

    const allInputs = screen.getAllByRole('textbox')
    // Campo B (order=1) debe aparecer antes que Campo A (order=2)
    expect(allInputs[0]).toHaveAttribute('data-testid', 'field-campo_b')
    expect(allInputs[1]).toHaveAttribute('data-testid', 'field-campo_a')
  })

  it('muestra el mensaje de tipo no soportado para tipos desconocidos', () => {
    // Usamos un cast para forzar un tipo ficticio
    const unknownField = makeField({ id: '99', key: 'raro', type: 'FILE', label: 'Raro', order: 1 })
    // FILE sí está soportado, así que usamos un cast deliberado a tipo no existente
    const fakeField = { ...unknownField, type: 'UNKNOWN_TYPE' } as unknown as FormField
    render(<DynamicForm fields={[fakeField]} values={{}} onChange={vi.fn()} />)
    expect(screen.getByText(/tipo de campo no soportado/i)).toBeInTheDocument()
  })
})
