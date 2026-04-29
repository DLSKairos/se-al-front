import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renderiza el texto pasado como children', () => {
    render(<Badge>Activo</Badge>)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('renderiza sin errores con la variante por defecto', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('variante success y danger tienen clases distintas entre sí', () => {
    const { rerender } = render(<Badge variant="success">Texto</Badge>)
    const successClass = screen.getByText('Texto').className

    rerender(<Badge variant="danger">Texto</Badge>)
    const dangerClass = screen.getByText('Texto').className

    expect(successClass).not.toBe(dangerClass)
  })

  it('variante warning tiene clases distintas a success', () => {
    const { rerender } = render(<Badge variant="success">Texto</Badge>)
    const successClass = screen.getByText('Texto').className

    rerender(<Badge variant="warning">Texto</Badge>)
    const warningClass = screen.getByText('Texto').className

    expect(successClass).not.toBe(warningClass)
  })

  it('variante info tiene clases distintas a default', () => {
    const { rerender } = render(<Badge variant="default">Texto</Badge>)
    const defaultClass = screen.getByText('Texto').className

    rerender(<Badge variant="info">Texto</Badge>)
    const infoClass = screen.getByText('Texto').className

    expect(defaultClass).not.toBe(infoClass)
  })

  it('variante draft tiene clases distintas a success', () => {
    const { rerender } = render(<Badge variant="success">Texto</Badge>)
    const successClass = screen.getByText('Texto').className

    rerender(<Badge variant="draft">Texto</Badge>)
    const draftClass = screen.getByText('Texto').className

    expect(successClass).not.toBe(draftClass)
  })

  it('acepta y aplica className adicional', () => {
    render(<Badge className="mi-clase-extra">Texto</Badge>)
    expect(screen.getByText('Texto').className).toContain('mi-clase-extra')
  })
})
