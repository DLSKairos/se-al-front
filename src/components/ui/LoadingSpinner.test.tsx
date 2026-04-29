import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renderiza el elemento con data-testid="loading-spinner"', () => {
    render(<LoadingSpinner />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('modo inline (por defecto) renderiza el spinner', () => {
    render(<LoadingSpinner />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('modo fullscreen renderiza el spinner', () => {
    render(<LoadingSpinner fullscreen />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('muestra el label por defecto "Cargando..."', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('muestra el label personalizado cuando se pasa', () => {
    render(<LoadingSpinner label="Por favor espere" />)
    expect(screen.getByText('Por favor espere')).toBeInTheDocument()
  })

  it('el elemento con role="status" tiene aria-label con el label del spinner', () => {
    render(<LoadingSpinner label="Procesando" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Procesando')
  })

  it('modo fullscreen aplica clase fixed distinta al modo inline', () => {
    const { rerender } = render(<LoadingSpinner fullscreen={false} />)
    const inlineClass = screen.getByTestId('loading-spinner').className

    rerender(<LoadingSpinner fullscreen={true} />)
    const fullscreenClass = screen.getByTestId('loading-spinner').className

    expect(inlineClass).not.toBe(fullscreenClass)
  })
})
