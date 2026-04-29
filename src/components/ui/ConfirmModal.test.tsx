import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from './ConfirmModal'

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Confirmar acción',
  description: '¿Estás seguro de que deseas continuar?',
  onConfirm: vi.fn(),
}

describe('ConfirmModal', () => {
  it('muestra el título pasado como prop', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Confirmar acción')).toBeInTheDocument()
  })

  it('muestra la descripción pasada como prop', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('¿Estás seguro de que deseas continuar?')).toBeInTheDocument()
  })

  it('click en confirm-modal-confirm llama onConfirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    await user.click(screen.getByTestId('confirm-modal-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('click en confirm-modal-cancel llama onOpenChange con false', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<ConfirmModal {...defaultProps} onOpenChange={onOpenChange} />)
    await user.click(screen.getByTestId('confirm-modal-cancel'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('muestra el label personalizado del botón de confirmación', () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Eliminar" />)
    expect(screen.getByTestId('confirm-modal-confirm')).toHaveTextContent('Eliminar')
  })

  it('muestra el label personalizado del botón de cancelación', () => {
    render(<ConfirmModal {...defaultProps} cancelLabel="Volver" />)
    expect(screen.getByTestId('confirm-modal-cancel')).toHaveTextContent('Volver')
  })

  it('con loading=true el botón confirmar queda deshabilitado', () => {
    render(<ConfirmModal {...defaultProps} loading={true} />)
    expect(screen.getByTestId('confirm-modal-confirm')).toBeDisabled()
  })

  it('con open=false no muestra el contenido', () => {
    render(<ConfirmModal {...defaultProps} open={false} />)
    expect(screen.queryByText('¿Estás seguro de que deseas continuar?')).not.toBeInTheDocument()
  })
})
