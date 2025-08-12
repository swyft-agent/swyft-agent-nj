"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<{
    hasUrl: boolean
    hasKey: boolean
    urlValue: string
    keyValue: string
  } | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setEnvStatus({
      hasUrl: !!url,
      hasKey: !!key,
      urlValue: url || "NOT SET",
      keyValue: key ? `${key.substring(0, 20)}...` : "NOT SET",
    })
  }, [])

  if (!envStatus) return null

  const hasIssues = !envStatus.hasUrl || !envStatus.hasKey

  if (!hasIssues) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">Environment Variable Issues Detected:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {!envStatus.hasUrl && <li>NEXT_PUBLIC_SUPABASE_URL is missing or empty</li>}
            {!envStatus.hasKey && <li>NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or empty</li>}
          </ul>
          <div className="mt-2 text-xs">
            <p>URL: {envStatus.urlValue}</p>
            <p>Key: {envStatus.keyValue}</p>
          </div>
          <p className="text-xs mt-2">Please check your .env.local file and restart the development server.</p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
