import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
}

// Clase mock de FileReader que actua como constructor
class FileReaderMock {
  onloadend: ((event: ProgressEvent) => void) | null = null
  result: string | null = null

  readAsDataURL(_file: Blob) {
    this.result = 'data:image/png;base64,fakecontent'
    // Llamar onloadend de forma sincrona en el mock
    if (this.onloadend) {
      this.onloadend(new ProgressEvent('loadend'))
    }
  }
}

describe('PhotoField', () => {
  let onChange: (file: File | null) => void
  let originalFileReader: typeof FileReader

  beforeEach(() => {
    onChange = vi.fn() as unknown as (file: File | null) => void
    originalFileReader = globalThis.FileReader
    // Reemplazar FileReader con la clase mock
    globalThis.FileReader = FileReaderMock as unknown as typeof FileReader
  })

  afterEach(() => {
    globalThis.FileReader = originalFileReader
  })

  it('se renderiza sin crash', () => {
    render(<PhotoField field={baseField} value={null} onChange={onChange} />)
    expect(screen.getByTestId('field-foto_doc')).toBeInTheDocument()
  })

  it('muestra el boton de tomar foto cuando no hay valor', () => {
    render(<PhotoField field={baseField} value={null} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /tomar foto/i })).toBeInTheDocument()
  })

  it('tiene un input de tipo file con accept de imagenes', () => {
    render(<PhotoField field={baseField} value={null} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('accept', 'image/*')
  })

  it('llama onChange con el File al subir una imagen', async () => {
    const user = userEvent.setup()
    render(<PhotoField field={baseField} value={null} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['imagen'], 'foto.png', { type: 'image/png' })
    await user.upload(input, file)
    expect(onChange).toHaveBeenCalledWith(file)
  })

  it('con disabled=true el boton de tomar foto esta deshabilitado', () => {
    render(<PhotoField field={baseField} value={null} onChange={onChange} disabled />)
    expect(screen.getByRole('button', { name: /tomar foto/i })).toBeDisabled()
  })

  it('con disabled=true el input file esta deshabilitado', () => {
    render(<PhotoField field={baseField} value={null} onChange={onChange} disabled />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('cuando hay un value File muestra el boton cambiar foto', () => {
    const file = new File(['imagen'], 'existente.png', { type: 'image/png' })
    render(<PhotoField field={baseField} value={file} onChange={onChange} />)
    // Sin preview cargado, el boton muestra "Cambiar foto" porque value !== null
    expect(screen.getByRole('button', { name: /cambiar foto/i })).toBeInTheDocument()
  })

  it('despues de subir una imagen se muestra la preview', async () => {
    const user = userEvent.setup()
    render(<PhotoField field={baseField} value={null} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['imagen'], 'foto.png', { type: 'image/png' })
    await user.upload(input, file)
    // Con el mock de FileReader, el preview se carga sincronicamente
    const preview = screen.queryByAltText('Vista previa')
    expect(preview).toBeInTheDocument()
  })

  it('al hacer click en eliminar foto llama onChange con null', async () => {
    const user = userEvent.setup()
    render(<PhotoField field={baseField} value={null} onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['imagen'], 'foto.png', { type: 'image/png' })
    await user.upload(input, file)

    const botonEliminar = screen.getByRole('button', { name: /eliminar foto/i })
    await user.click(botonEliminar)
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
