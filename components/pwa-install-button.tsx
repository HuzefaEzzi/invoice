'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Hide button if already running as installed PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone ?? false
    if (standalone || isStandalone) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } finally {
      setIsInstalling(false)
    }
  }

  if (isInstalled) return null
  if (!deferredPrompt) {
    return (
      <p className="text-sm text-muted-foreground">
        Use your browser&apos;s menu (e.g. Chrome: ⋮ → &quot;Install Invoice Manager&quot; or the ⊕ icon in the
        address bar) to install the app. Install may appear after you use the site for a bit.
      </p>
    )
  }

  return (
    <Button variant="outline" onClick={handleInstall} disabled={isInstalling}>
      <Download className="h-4 w-4 mr-2" />
      {isInstalling ? 'Installing…' : 'Install App'}
    </Button>
  )
}
