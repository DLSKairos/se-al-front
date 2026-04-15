import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from './Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPWAButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!promptEvent) return null

  const handleInstall = async () => {
    setInstalling(true)
    try {
      await promptEvent.prompt()
      await promptEvent.userChoice
      setPromptEvent(null)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      loading={installing}
      onClick={handleInstall}
      className="gap-2"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      Instalar app
    </Button>
  )
}
