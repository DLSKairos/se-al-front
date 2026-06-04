import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoField } from './PhotoField'
import type { FormField } from '@/types'

const baseField: FormField = {
  id: 'field-8',
  template_id: 'template-1',
  order: 8,
  label: 'Foto del documento',
  key: 'foto_doc',
  type: 'PHOTO',
  required: false,
  default_value: null,
  options: null,
  validations: null,
  revalidation_frequency: 'INHERIT',
  help_text: null,
}

describe('PhotoField', () => {
  let onChange: (files: File[]) => void

  beforeEach(() => {
    onChange = vi.fn()
    // URL.createObjectURL mock
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('se renderiza sin crash', () => {
    render(<PhotoField field={baseField} value={[]} onChange={onChange} />)
    expect(screen.getByTestId('field-foto_doc')).toBeInTheDocument()
  })

  it('muestra el boton de tomar foto cuando no hay fotos', () => {
    render(<PhotoField field={baseField} value={[]} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /tomar foto/i })).toBeInTheDocument()
  })

  it('tiene un input de tipo file con accept de imagenes y multiple', () => {
    render(<PhotoField field={baseField} value={[]} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('multiple')
  })

  it('llama onChange con el array de archivos al subir imagenes', async () => {
    const user = userEvent.setup()
    render(<PhotoField field={baseField} value={[]} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['imagen'], 'foto.png', { type: 'image/png' })
    await user.upload(input, file)
    expect(onChange).toHaveBeenCalledWith([file])
  })

  it('acumula fotos al agregar mas', async () => {
    const file1 = new File(['a'], 'foto1.png', { type: 'image/png' })
    const file2 = new File(['b'], 'foto2.png', { type: 'image/png' })
    const user = userEvent.setup()
    render(<PhotoField field={baseField} value={[file1]} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file2)
    expect(onChange).toHaveBeenCalledWith([file1, file2])
  })

  it('muestra thumbnails cuando hay fotos', () => {
    const file = new File(['a'], 'foto.png', { type: 'image/png' })
    render(<PhotoField field={baseField} value={[file]} onChange={onChange} />)
    expect(screen.getByAltText('Foto 1')).toBeInTheDocument()
  })

  it('al hacer click en eliminar foto llama onChange sin ese archivo', async () => {
    const user = userEvent.setup()
    const file = new File(['a'], 'foto.png', { type: 'image/png' })
    render(<PhotoField field={baseField} value={[file]} onChange={onChange} />)
    const botonEliminar = screen.getByRole('button', { name: /eliminar foto 1/i })
    await user.click(botonEliminar)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('con disabled=true no muestra botones de accion', () => {
    render(<PhotoField field={baseField} value={[]} onChange={onChange} disabled />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
