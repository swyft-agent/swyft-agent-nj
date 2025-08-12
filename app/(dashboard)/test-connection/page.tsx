"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, RefreshCw, Code } from "lucide-react"
import { supabase, testSupabaseConnection, isUsingMockData, toggleDevMode } from "@/lib/supabase"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState({
    testing: false,
    connected: false,
    error: null as string | null,
    lastTested: null as Date | null,
    mock: true,
  })

  const [envVars, setEnvVars] = useState({
    url: "",
    key: "",
  })

  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    // Check if dev mode is enabled
    const isDevMode = localStorage.getItem("SWYFT_DEV_MODE") === "true"
    setDevMode(isDevMode)

    // Get environment variables for display
    setEnvVars({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (hidden)" : "Not set",
    })

    // Test connection on load
    testConnection()
  }, [])

  const testConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, testing: true }))

    try {
      const result = await testSupabaseConnection()
      setConnectionStatus({
        testing: false,
        connected: result.connected,
        error: result.error,
        lastTested: new Date(),
        mock: result.mock || false,
      })
    } catch (error: any) {
      setConnectionStatus({
        testing: false,
        connected: false,
        error: error.message,
        lastTested: new Date(),
        mock: true,
      })
    }
  }

  const testDirectInsert = async () => {
    try {
      console.log("Testing direct insert...")
      const testData = {
        company_name: "Test Company",
        contact_name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        subscription_plan: "basic",
      }

      const { data, error } = await supabase.from("company_accounts").insert(testData)

      console.log("Insert result:", { data, error })

      if (error) {
        alert(`Insert failed: ${error.message}`)
      } else {
        alert("Insert successful! Check your database.")
      }
    } catch (error: any) {
      console.error("Insert error:", error)
      alert(`Insert error: ${error.message}`)
    }
  }

  const handleDevModeToggle = (checked: boolean) => {
    setDevMode(checked)
    toggleDevMode(checked)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Database Connection Test</h1>
        <Button onClick={testConnection} disabled={connectionStatus.testing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus.testing ? "animate-spin" : ""}`} />
          Test Connection
        </Button>
      </div>

      {/* Development Mode Toggle */}
      <Card className="border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Development Mode
          </CardTitle>
          <CardDescription>Enable this to use real database connections in the v0 preview environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="dev-mode" checked={devMode} onCheckedChange={handleDevModeToggle} />
            <Label htmlFor="dev-mode">{devMode ? "Development mode enabled" : "Development mode disabled"}</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {devMode
              ? "Using real database connection. Your data will be saved to Supabase."
              : "Using mock data. No changes will be saved to your database."}
          </p>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Current Supabase configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">NEXT_PUBLIC_SUPABASE_URL</label>
              <div className="p-2 bg-gray-100 rounded text-sm font-mono break-all">{envVars.url}</div>
            </div>
            <div>
              <label className="text-sm font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
              <div className="p-2 bg-gray-100 rounded text-sm font-mono">{envVars.key}</div>
            </div>
          </div>

          {isUsingMockData && !devMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Currently using mock data. Enable Development Mode above to use your real database.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            {connectionStatus.lastTested && `Last tested: ${connectionStatus.lastTested.toLocaleTimeString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus.testing ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Testing connection...</span>
            </div>
          ) : connectionStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center text-green-600">
                <CheckCircle className="mr-2 h-5 w-5" />
                <span>
                  {connectionStatus.mock
                    ? "Connected to mock database (no real data)"
                    : "Connected to Supabase successfully!"}
                </span>
              </div>
              {!connectionStatus.mock && (
                <Button onClick={testDirectInsert} variant="outline">
                  Test Direct Insert
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center text-red-600">
                <XCircle className="mr-2 h-5 w-5" />
                <span>Connection failed</span>
              </div>
              {connectionStatus.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {connectionStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Using Mock Data:</strong> {isUsingMockData ? "Yes" : "No"}
            </div>
            <div>
              <strong>Development Mode:</strong> {devMode ? "Enabled" : "Disabled"}
            </div>
            <div>
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
            <div>
              <strong>Window Location:</strong> {typeof window !== "undefined" ? window.location.hostname : "Server"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
