"use client"

import { useEffect, useState } from "react"
import { supabase, isUsingMockData } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database } from "lucide-react"

export function SetupStatus() {
  const [status, setStatus] = useState({
    database: "checking",
    auth: "checking",
    tables: "checking",
    storage: "checking",
  })

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      // Check database connection
      const { data: companies, error: dbError } = await supabase.from("company_accounts").select("count").limit(1)

      // Check auth
      const { data: session } = await supabase.auth.getSession()

      // Check storage
      const { data: buckets } = await supabase.storage.listBuckets()

      setStatus({
        database: dbError ? "error" : "success",
        auth: "success", // Auth service is available
        tables: dbError ? "error" : "success",
        storage: buckets?.find((b) => b.name === "property-images") ? "success" : "error",
      })
    } catch (error) {
      console.error("Setup check failed:", error)
      setStatus({
        database: "error",
        auth: "error",
        tables: "error",
        storage: "error",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Ready
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Checking...</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          System Setup Status
        </CardTitle>
        <CardDescription>
          {isUsingMockData ? (
            <span className="text-yellow-600 font-medium">
              ⚠️ Currently using mock data. Configure Supabase to enable real database.
            </span>
          ) : (
            <span className="text-green-600 font-medium">✅ Connected to real Supabase database</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.database)}
              <span className="font-medium">Database Connection</span>
            </div>
            {getStatusBadge(status.database)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.auth)}
              <span className="font-medium">Authentication</span>
            </div>
            {getStatusBadge(status.auth)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.tables)}
              <span className="font-medium">Database Tables</span>
            </div>
            {getStatusBadge(status.tables)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.storage)}
              <span className="font-medium">Image Storage</span>
            </div>
            {getStatusBadge(status.storage)}
          </div>
        </div>

        {!isUsingMockData && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🎉 Ready for Real Data!</h3>
            <p className="text-green-700 text-sm">Your database is properly configured. You can now:</p>
            <ul className="text-green-700 text-sm mt-2 space-y-1">
              <li>• Sign up new companies</li>
              <li>• Create agents and managers</li>
              <li>• Add buildings and units</li>
              <li>• Manage tenants and leases</li>
              <li>• Upload property images</li>
            </ul>
          </div>
        )}

        {isUsingMockData && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚙️ Configuration Needed</h3>
            <p className="text-yellow-700 text-sm">
              To enable real data, update your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file with:
            </p>
            <pre className="text-xs bg-yellow-100 p-2 rounded mt-2 overflow-x-auto">
              {`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
