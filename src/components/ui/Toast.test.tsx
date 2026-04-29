import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

// Componente auxiliar para disparar toasts desde tests
function ToastTrigger({ type, message }: { type: 'success' | 'error' | 'warning'; message: string }) {
  const toast = useToast()
  return (
    <button
      data-testid="trigger"
      onClick={() => toast[type](message)}
    >
      Disparar
    </button>
  )
}

function renderWithToast(type: 'success' | 'error' | 'warning', message: string) {
  return render(
    <ToastProvider>
      <ToastTrigger type={type} message={message} />
    </ToastProvider>
  )
}

describe('ToastProvider — sin fake timers', () => {
  it('muestra un toast de éxito con el mensaje correcto', async () => {
    const user = userEvent.setup()
    renderWithToast('success', 'Operación exitosa')
    await user.click(screen.getByTestId('trigger'))
    expect(screen.getByTestId('toast-message')).toBeInTheDocument()
    expect(screen.getByText('Operación exitosa')).toBeInTheDocument()
  })

  it('muestra un toast de error con el mensaje correcto', async () => {
    const user = userEvent.setup()
    renderWithToast('error', 'Ocurrió un error')
    await user.click(screen.getByTestId('trigger'))
    expect(screen.getByTestId('toast-message')).toBeInTheDocument()
    expect(screen.getByText('Ocurrió un error')).toBeInTheDocument()
  })

  it('muestra un toast de advertencia con el mensaje correcto', async () => {
    const user = userEvent.setup()
    renderWithToast('warning', 'Advertencia importante')
    await user.click(screen.getByTestId('trigger'))
    expect(screen.getByText('Advertencia importante')).toBeInTheDocument()
  })

  it('toast de éxito tiene clase de borde distinta al de error', async () => {
    const user = userEvent.setup()

    const { unmount } = render(
      <ToastProvider>
        <ToastTrigger type="success" message="Éxito" />
      </ToastProvider>
    )
    await user.click(screen.getByTestId('trigger'))
    const successClass = screen.getByTestId('toast-message').className
    unmount()

    render(
      <ToastProvider>
        <ToastTrigger type="error" message="Error" />
      </ToastProvider>
    )
    await user.click(screen.getByTestId('trigger'))
    const errorClass = screen.getByTestId('toast-message').className

    expect(successClass).not.toBe(errorClass)
  })

  it('se puede cerrar manualmente haciendo click en el botón de cierre', async () => {
    const user = userEvent.setup()
    renderWithToast('success', 'Cerrar manualmente')
    await user.click(screen.getByTestId('trigger'))
    expect(screen.getByTestId('toast-message')).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: 'Cerrar' })
    await user.click(closeButton)

    expect(screen.queryByTestId('toast-message')).not.toBeInTheDocument()
  })

  it('useToast lanza error cuando se usa fuera de ToastProvider', () => {
    function ComponentSinProvider() {
      useToast()
      return null
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ComponentSinProvider />)).toThrow(
      'useToast debe usarse dentro de ToastProvider'
    )
    consoleError.mockRestore()
  })
})

describe('ToastProvider — con fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('el toast desaparece automáticamente después de 4 segundos', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="success" message="Auto dismiss" />
      </ToastProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('trigger'))
    })

    expect(screen.getByTestId('toast-message')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByTestId('toast-message')).not.toBeInTheDocument()
  })

  it('el toast no desaparece antes de 4 segundos', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="warning" message="Advertencia" />
      </ToastProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('trigger'))
    })

    act(() => {
      vi.advanceTimersByTime(3999)
    })

    expect(screen.getByTestId('toast-message')).toBeInTheDocument()
  })
})
