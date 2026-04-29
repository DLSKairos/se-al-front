import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileField } from './FileField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-9',
  template_id: 'template-1',
  order: 9,
  label: 'Documento adjunto',
  key: 'documento',
  type: 'FILE',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
}

describe('FileField', () => {
  let onChange: (file: File | null) => void

  beforeEach(() => {
    onChange = vi.fn() as unknown as (file: File | null) => void
  })

  it('se renderiza sin crash', () => {
    render(<FileField field={baseField} value={null} onChange={onChange} />)
    expect(screen.getByTestId('field-documento')).toBeInTheDocument()
  })

  it('muestra el boton seleccionar archivo cuando no hay valor', () => {
    render(<FileField field={baseField} value={null} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /seleccionar archivo/i })).toBeInTheDocument()
  })

  it('tiene un input de tipo file', () => {
    render(<FileField field={baseField} value={null} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
  })

  it('llama onChange con el File al seleccionar un archivo', async () => {
    const user = userEvent.setup()
    render(<FileField field={baseField} value={null} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['contenido'], 'documento.pdf', { type: 'application/pdf' })
    await user.upload(input, file)
    expect(onChange).toHaveBeenCalledWith(file)
  })

  it('muestra el nombre del archivo cuando hay un value', () => {
    const file = new File(['contenido'], 'informe-final.pdf', { type: 'application/pdf' })
    render(<FileField field={baseField} value={file} onChange={onChange} />)
    expect(screen.getByText('informe-final.pdf')).toBeInTheDocument()
  })

  it('muestra el tamanio del archivo en KB', () => {
    const contenido = 'a'.repeat(2048)
    const file = new File([contenido], 'grande.txt', { type: 'text/plain' })
    render(<FileField field={baseField} value={file} onChange={onChange} />)
    expect(screen.getByText('2 KB')).toBeInTheDocument()
  })

  it('muestra el boton de eliminar cuando hay un archivo', () => {
    const file = new File(['contenido'], 'archivo.pdf', { type: 'application/pdf' })
    render(<FileField field={baseField} value={file} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /eliminar archivo/i })).toBeInTheDocument()
  })

  it('al hacer click en eliminar llama onChange con null', async () => {
    const user = userEvent.setup()
    const file = new File(['contenido'], 'archivo.pdf', { type: 'application/pdf' })
    render(<FileField field={baseField} value={file} onChange={onChange} />)
    const botonEliminar = screen.getByRole('button', { name: /eliminar archivo/i })
    await user.click(botonEliminar)
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('con disabled=true el boton seleccionar esta deshabilitado', () => {
    render(<FileField field={baseField} value={null} onChange={onChange} disabled />)
    expect(screen.getByRole('button', { name: /seleccionar archivo/i })).toBeDisabled()
  })

  it('con disabled=true el input file esta deshabilitado', () => {
    render(<FileField field={baseField} value={null} onChange={onChange} disabled />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('con disabled=true y hay archivo, no muestra boton eliminar', () => {
    const file = new File(['contenido'], 'archivo.pdf', { type: 'application/pdf' })
    render(<FileField field={baseField} value={file} onChange={onChange} disabled />)
    expect(screen.queryByRole('button', { name: /eliminar archivo/i })).not.toBeInTheDocument()
  })
})
