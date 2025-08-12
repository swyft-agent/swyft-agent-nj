"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isInWebAppiOS
      setIsInstalled(isInstalled)
      return isInstalled
    }

    if (checkInstalled()) {
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      console.log("PWA install prompt available")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Show custom prompt after 5 seconds
    const timer = setTimeout(() => {
      if (!checkInstalled()) {
        setShowPrompt(true)
        console.log("Showing PWA install prompt")
      }
    }, 5000)

    // Auto-hide after 10 seconds
    const hideTimer = setTimeout(() => {
      setShowPrompt(false)
    }, 15000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      clearTimeout(timer)
      clearTimeout(hideTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("PWA install outcome:", outcome)
      setDeferredPrompt(null)
    }
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-green-600 text-white border-green-700 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Smartphone className="h-6 w-6 text-green-100" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Install Swyft Agent</h3>
              <p className="text-xs text-green-100 mb-3">
                Install our app for a better experience with offline access and quick launch.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstall}
                  className="bg-white text-green-600 hover:bg-green-50 text-xs px-3 py-1 h-auto"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-green-100 hover:text-white hover:bg-green-700 text-xs px-3 py-1 h-auto"
                >
                  Later
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="flex-shrink-0 text-green-100 hover:text-white hover:bg-green-700 p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
