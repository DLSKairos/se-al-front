import { describe, it, expect } from 'vitest'

describe('Setup de testing', () => {
  it('el entorno de testing está configurado correctamente', () => {
    expect(true).toBe(true)
  })

  it('localStorage mock está disponible', () => {
    localStorage.setItem('test-key', 'test-value')
    expect(localStorage.getItem('test-key')).toBe('test-value')
    localStorage.clear()
    expect(localStorage.getItem('test-key')).toBeNull()
  })

  it('geolocation mock está disponible', () => {
    expect(navigator.geolocation).toBeDefined()
    expect(navigator.geolocation.getCurrentPosition).toBeDefined()
  })

  it('mediaDevices mock está disponible', () => {
    expect(navigator.mediaDevices).toBeDefined()
    expect(navigator.mediaDevices.getUserMedia).toBeDefined()
  })
})
