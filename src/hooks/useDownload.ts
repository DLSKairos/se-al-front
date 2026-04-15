import { useState } from 'react'
import { downloadFile } from '@/lib/utils'

export function useDownload() {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = async (url: string, filename: string) => {
    setDownloading(true)
    setError(null)
    try {
      await downloadFile(url, filename)
    } catch (e) {
      setError('Error al descargar el archivo')
    } finally {
      setDownloading(false)
    }
  }

  return { download, downloading, error }
}
