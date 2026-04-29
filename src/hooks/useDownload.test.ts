import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDownload } from '@/hooks/useDownload'

// downloadFile usa fetch internamente — lo mockeamos a nivel de módulo
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>()
  return {
    ...actual,
    downloadFile: vi.fn(),
  }
})

import { downloadFile } from '@/lib/utils'
const mockDownloadFile = downloadFile as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useDownload', () => {
  describe('estado inicial', () => {
    it('downloading es false en el estado inicial', () => {
      const { result } = renderHook(() => useDownload())
      expect(result.current.downloading).toBe(false)
    })

    it('error es null en el estado inicial', () => {
      const { result } = renderHook(() => useDownload())
      expect(result.current.error).toBeNull()
    })

    it('expone la función download', () => {
      const { result } = renderHook(() => useDownload())
      expect(typeof result.current.download).toBe('function')
    })
  })

  describe('descarga exitosa', () => {
    it('downloading pasa a true mientras espera la descarga', async () => {
      let resolveDownload!: () => void
      const pendingPromise = new Promise<void>((resolve) => {
        resolveDownload = resolve
      })
      mockDownloadFile.mockReturnValueOnce(pendingPromise)

      const { result } = renderHook(() => useDownload())

      act(() => {
        result.current.download('/reports/test.pdf', 'test.pdf')
      })

      expect(result.current.downloading).toBe(true)

      await act(async () => {
        resolveDownload()
        await pendingPromise
      })
    })

    it('downloading vuelve a false después de una descarga exitosa', async () => {
      mockDownloadFile.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/test.pdf', 'test.pdf')
      })

      expect(result.current.downloading).toBe(false)
    })

    it('error permanece null después de una descarga exitosa', async () => {
      mockDownloadFile.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/test.pdf', 'test.pdf')
      })

      expect(result.current.error).toBeNull()
    })

    it('llama a downloadFile con la url y el filename correctos', async () => {
      mockDownloadFile.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/exports/reporte.xlsx', 'reporte.xlsx')
      })

      expect(mockDownloadFile).toHaveBeenCalledOnce()
      expect(mockDownloadFile).toHaveBeenCalledWith('/exports/reporte.xlsx', 'reporte.xlsx')
    })
  })

  describe('cuando fetch rechaza (error de red)', () => {
    it('error se setea con mensaje de error después de un rechazo', async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/test.pdf', 'test.pdf')
      })

      expect(result.current.error).toBe('Error al descargar el archivo')
    })

    it('downloading vuelve a false después de un rechazo', async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/test.pdf', 'test.pdf')
      })

      expect(result.current.downloading).toBe(false)
    })
  })

  describe('cuando el servidor responde con status de error', () => {
    it('error se setea cuando downloadFile lanza por status 404', async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error('Error al descargar el archivo'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/no-existe.pdf', 'no-existe.pdf')
      })

      expect(result.current.error).toBe('Error al descargar el archivo')
    })

    it('downloading vuelve a false cuando el servidor responde con 404', async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error('Error al descargar el archivo'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/no-existe.pdf', 'no-existe.pdf')
      })

      expect(result.current.downloading).toBe(false)
    })

    it('error se setea cuando downloadFile lanza por status 500', async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error('Internal Server Error'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/error.pdf', 'error.pdf')
      })

      expect(result.current.error).toBe('Error al descargar el archivo')
    })
  })

  describe('múltiples descargas consecutivas', () => {
    it('el error previo se limpia al iniciar una nueva descarga exitosa', async () => {
      mockDownloadFile.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.download('/reports/fail.pdf', 'fail.pdf')
      })
      expect(result.current.error).toBe('Error al descargar el archivo')

      mockDownloadFile.mockResolvedValueOnce(undefined)

      await act(async () => {
        await result.current.download('/reports/ok.pdf', 'ok.pdf')
      })

      expect(result.current.error).toBeNull()
    })
  })
})
