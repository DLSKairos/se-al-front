import { useCallback } from 'react'

interface UseCameraCaptureOptions {
  accept?: string
  capture?: 'environment' | 'user'
  multiple?: boolean
}

export function useCameraCapture(
  onCapture: (file: File) => void,
  options: UseCameraCaptureOptions = {},
) {
  const { accept = 'image/*', capture = 'environment', multiple = false } = options

  const openCamera = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.capture = capture
    input.multiple = multiple
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onCapture(file)
    }
    input.click()
  }, [accept, capture, multiple, onCapture])

  return { openCamera }
}
