'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [swRegistered, setSwRegistered] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && !swRegistered) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[SW] Registered:', reg.scope)
        setSwRegistered(true)
      }).catch((err) => {
        console.error('[SW] Registration failed:', err)
      })
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show after 30s or if not dismissed in last 7 days
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      const lastDismissed = dismissed ? Date.now() - Number(dismissed) : Infinity
      if (lastDismissed > 7 * 24 * 3600 * 1000) {
        setTimeout(() => setShowBanner(true), 10000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [swRegistered])

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  function dismiss() {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', String(Date.now()))
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 flex items-start gap-3 animate-in slide-in-from-bottom-4">
      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-white text-lg">⚡</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">Instalar VN Commerce</p>
        <p className="text-xs text-gray-500 mt-0.5">Adicione ao ecrã inicial para acesso rápido e notificações</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={install} className="bg-orange-500 hover:bg-orange-600 text-xs h-7">
            <Download className="w-3 h-3 mr-1" />Instalar
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} className="text-xs h-7">Agora não</Button>
        </div>
      </div>
      <button onClick={dismiss} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
