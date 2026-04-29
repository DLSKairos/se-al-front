import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renderiza el data-testid="error-message" cuando se pasa un mensaje', () => {
    render(<ErrorMessage message="Algo salió mal" />)
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
  })

  it('muestra el texto del mensaje de error', () => {
    render(<ErrorMessage message="No se pudo cargar la información" />)
    expect(screen.getByText('No se pudo cargar la información')).toBeInTheDocument()
  })

  it('usa el título por defecto "Error" si no se pasa title', () => {
    render(<ErrorMessage message="Mensaje de prueba" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('muestra el título personalizado cuando se pasa', () => {
    render(<ErrorMessage title="Fallo de conexión" message="No hay red" />)
    expect(screen.getByText('Fallo de conexión')).toBeInTheDocument()
  })

  it('no muestra el botón Reintentar cuando no se pasa onRetry', () => {
    render(<ErrorMessage message="Error sin reintentar" />)
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument()
  })

  it('muestra el botón Reintentar cuando se pasa onRetry', () => {
    render(<ErrorMessage message="Error con reintentar" onRetry={vi.fn()} />)
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('llama onRetry al hacer click en el botón Reintentar', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={onRetry} />)
    await user.click(screen.getByText('Reintentar'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
