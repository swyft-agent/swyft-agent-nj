"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { isUsingMockData, testSupabaseConnection } from "@/lib/supabase"

export function ConnectionStatus() {
  const [status, setStatus] = useState<{
    checking: boolean
    connected: boolean
    error: string | null
  }>({
    checking: true,
    connected: false,
    error: null,
  })

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    const result = await testSupabaseConnection()
    setStatus({
      checking: false,
      connected: result.connected,
      error: result.error,
    })
  }

  if (status.checking) {
    return (
      <Alert>
        <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
        <AlertDescription>Checking database connection...</AlertDescription>
      </Alert>
    )
  }

  if (status.connected) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">Connected</AlertDescription>
      </Alert>
    )
  }

  if (isUsingMockData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Demo Mode: Configure your Supabase environment variables to enable real authentication.
          <br />
          <small className="text-xs">
            Check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
            correctly.
          </small>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>Database connection failed: {status.error}</AlertDescription>
    </Alert>
  )
}
