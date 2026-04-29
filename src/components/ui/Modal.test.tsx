import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('con isOpen=false el contenido NO está visible en el DOM', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} title="Mi Modal">
        <p>Contenido del modal</p>
      </Modal>
    )
    expect(screen.queryByText('Contenido del modal')).not.toBeInTheDocument()
  })

  it('con isOpen=true el children sí está visible', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Mi Modal">
        <p>Contenido del modal</p>
      </Modal>
    )
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument()
  })

  it('con isOpen=true muestra el título', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Título visible">
        <p>Contenido</p>
      </Modal>
    )
    expect(screen.getByText('Título visible')).toBeInTheDocument()
  })

  it('con isOpen=true muestra la descripción cuando se pasa', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Título" description="Descripción del modal">
        <p>Contenido</p>
      </Modal>
    )
    expect(screen.getByText('Descripción del modal')).toBeInTheDocument()
  })

  it('click en el botón de cierre llama onOpenChange con false', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleOpenChange} title="Mi Modal">
        <p>Contenido</p>
      </Modal>
    )
    await user.click(screen.getByTestId('modal-close'))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('el botón de cierre está presente cuando el modal está abierto', () => {
    render(
      <Modal open={true} onOpenChange={vi.fn()} title="Mi Modal">
        <p>Contenido</p>
      </Modal>
    )
    expect(screen.getByTestId('modal-close')).toBeInTheDocument()
  })
})
