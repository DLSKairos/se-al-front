import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza el children correctamente', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByText('Guardar')).toBeInTheDocument()
  })

  it('llama onClick al hacer click', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Guardar</Button>)
    await user.click(screen.getByTestId('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('con disabled=true no llama onClick', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Guardar</Button>)
    await user.click(screen.getByTestId('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('con disabled=true el elemento tiene el atributo disabled', () => {
    render(<Button disabled>Guardar</Button>)
    expect(screen.getByTestId('button')).toBeDisabled()
  })

  it('la prop testId cambia el data-testid del botón', () => {
    render(<Button testId="mi-boton-custom">Guardar</Button>)
    expect(screen.getByTestId('mi-boton-custom')).toBeInTheDocument()
  })

  it('variante primary y secondary tienen clases distintas entre sí', () => {
    const { rerender } = render(<Button variant="primary">Texto</Button>)
    const primaryClass = screen.getByTestId('button').className

    rerender(<Button variant="secondary">Texto</Button>)
    const secondaryClass = screen.getByTestId('button').className

    expect(primaryClass).not.toBe(secondaryClass)
  })

  it('variante danger tiene clases distintas a primary', () => {
    const { rerender } = render(<Button variant="primary">Texto</Button>)
    const primaryClass = screen.getByTestId('button').className

    rerender(<Button variant="danger">Texto</Button>)
    const dangerClass = screen.getByTestId('button').className

    expect(primaryClass).not.toBe(dangerClass)
  })

  it('variante ghost tiene clases distintas a primary', () => {
    const { rerender } = render(<Button variant="primary">Texto</Button>)
    const primaryClass = screen.getByTestId('button').className

    rerender(<Button variant="ghost">Texto</Button>)
    const ghostClass = screen.getByTestId('button').className

    expect(primaryClass).not.toBe(ghostClass)
  })

  it('con loading=true el botón queda deshabilitado', () => {
    render(<Button loading>Guardar</Button>)
    expect(screen.getByTestId('button')).toBeDisabled()
  })
})
