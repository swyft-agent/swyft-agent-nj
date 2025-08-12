"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, Bug } from "lucide-react"

export function DebugPanel() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runDiagnostics = async () => {
    setTesting(true)
    setResults(null)

    try {
      const response = await fetch("/api/uploads/debug")
      const data = await response.json()

      setResults({
        success: response.ok,
        status: response.status,
        data,
      })
    } catch (error) {
      setResults({
        success: false,
        status: 0,
        data: { error: "Network error", details: error instanceof Error ? error.message : "Unknown" },
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          System Diagnostics
        </CardTitle>
        <CardDescription>Test your upload system to identify issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={testing} className="w-full">
          {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {testing ? "Running Diagnostics..." : "Run System Check"}
        </Button>

        {results && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.success ? "All Systems OK" : "Issues Found"}
              </Badge>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <pre className="text-sm overflow-auto">{JSON.stringify(results.data, null, 2)}</pre>
            </div>

            {!results.success && (
              <div className="bg-red-50 p-3 rounded-md">
                <h4 className="font-medium text-red-800 mb-2">Common Solutions:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {results.data?.error?.includes("bucket") && (
                    <li>• Create a storage bucket named "documents" in Supabase</li>
                  )}
                  {results.data?.error?.includes("permission") && (
                    <li>• Check storage bucket permissions and RLS policies</li>
                  )}
                  {results.data?.error?.includes("connection") && <li>• Verify your Supabase environment variables</li>}
                  <li>• Make sure your Supabase project is active</li>
                  <li>• Check browser console for detailed errors</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
