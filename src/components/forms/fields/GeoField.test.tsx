import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GeoField } from './GeoField'

describe('GeoField', () => {
  it('se renderiza sin crash', () => {
    render(<GeoField lat={null} lng={null} />)
    expect(screen.getByText(/Obteniendo ubicacion/i)).toBeInTheDocument()
  })

  it('muestra mensaje de carga cuando lat y lng son null', () => {
    render(<GeoField lat={null} lng={null} />)
    expect(screen.getByText('Obteniendo ubicacion...')).toBeInTheDocument()
  })

  it('muestra las coordenadas cuando lat y lng tienen valor', () => {
    render(<GeoField lat={4.711} lng={-74.0721} />)
    expect(screen.getByText(/4\.711000.*-74\.072100/)).toBeInTheDocument()
  })

  it('muestra lat con 6 decimales', () => {
    render(<GeoField lat={4.71100} lng={-74.07210} />)
    const texto = screen.getByText(/4\.711000/)
    expect(texto).toBeInTheDocument()
  })

  it('no muestra el mensaje de carga cuando hay coordenadas', () => {
    render(<GeoField lat={4.711} lng={-74.0721} />)
    expect(screen.queryByText(/Obteniendo ubicacion/i)).not.toBeInTheDocument()
  })

  it('el mock de geolocation esta configurado en setup', () => {
    expect(navigator.geolocation.getCurrentPosition).toBeDefined()
    expect(vi.isMockFunction(navigator.geolocation.getCurrentPosition)).toBe(true)
  })

  it('el mock de geolocation retorna las coordenadas esperadas', () => {
    const successCallback = vi.fn()
    navigator.geolocation.getCurrentPosition(successCallback)
    expect(successCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        coords: expect.objectContaining({
          latitude: 4.7110,
          longitude: -74.0721,
        }),
      })
    )
  })

  it('el mock de geolocation puede simular un error', () => {
    const successCallback = vi.fn()
    const errorCallback = vi.fn()

    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementationOnce(
      (_success, error) => error?.({ code: 1, message: 'Denied' } as GeolocationPositionError)
    )

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback)

    expect(errorCallback).toHaveBeenCalledWith(
      expect.objectContaining({ code: 1, message: 'Denied' })
    )
    expect(successCallback).not.toHaveBeenCalled()
  })
})
