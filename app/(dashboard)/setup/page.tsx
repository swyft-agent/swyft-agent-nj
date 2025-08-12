"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertTriangle, Info, Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState({
    checking: true,
    supabaseConnected: false,
    tablesExist: false,
    policiesExist: false,
    storageExists: false,
    error: null as string | null,
  })

  useEffect(() => {
    async function checkSetup() {
      try {
        // Check Supabase connection
        const { data: connectionTest, error: connectionError } = await supabase
          .from("company_accounts")
          .select("count")
          .limit(1)

        if (connectionError) {
          if (connectionError.message.includes("permission denied")) {
            // This is actually good - it means Supabase is connected but RLS is working
            setSetupStatus((prev) => ({ ...prev, supabaseConnected: true }))
          } else {
            throw new Error(`Connection error: ${connectionError.message}`)
          }
        } else {
          setSetupStatus((prev) => ({ ...prev, supabaseConnected: true }))
        }

        // Check if tables exist by trying to get their structure
        const { data: tablesData, error: tablesError } = await supabase.rpc("check_tables_exist")

        if (!tablesError && tablesData) {
          setSetupStatus((prev) => ({ ...prev, tablesExist: true }))
        }

        // Check if policies exist
        const { data: policiesData, error: policiesError } = await supabase.rpc("check_policies_exist")

        if (!policiesError && policiesData) {
          setSetupStatus((prev) => ({ ...prev, policiesExist: true }))
        }

        // Check if storage bucket exists
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket("property-images")

        if (!bucketError && bucketData) {
          setSetupStatus((prev) => ({ ...prev, storageExists: true }))
        }
      } catch (error: any) {
        console.error("Setup check error:", error)
        setSetupStatus((prev) => ({ ...prev, error: error.message }))
      } finally {
        setSetupStatus((prev) => ({ ...prev, checking: false }))
      }
    }

    checkSetup()
  }, [])

  const copyEnvTemplate = () => {
    const template = `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`

    navigator.clipboard
      .writeText(template)
      .then(() => alert("Environment template copied to clipboard!"))
      .catch((err) => console.error("Failed to copy: ", err))
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">System Setup</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Check if your app can connect to Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {setupStatus.checking ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>Checking connection...</span>
              </div>
            ) : setupStatus.supabaseConnected ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                <span>Connected to Supabase successfully!</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle className="mr-2 h-5 w-5" />
                <span>Failed to connect to Supabase</span>
              </div>
            )}
          </CardContent>
          {!setupStatus.supabaseConnected && !setupStatus.checking && (
            <CardFooter>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2">Make sure you have set up your environment variables correctly:</p>
                  <div className="bg-slate-800 text-white p-3 rounded-md mb-3 flex justify-between items-center">
                    <code>NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co</code>
                    <Button variant="ghost" size="icon" onClick={copyEnvTemplate}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-slate-800 text-white p-3 rounded-md flex justify-between items-center">
                    <code>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</code>
                    <Button variant="ghost" size="icon" onClick={copyEnvTemplate}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Setup</CardTitle>
            <CardDescription>Check if your database tables and policies are set up correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 ${setupStatus.tablesExist ? "text-green-600" : "text-red-600"}`}>
                  {setupStatus.tablesExist ? <CheckCircle2 /> : <XCircle />}
                </div>
                <span>Database Tables</span>
              </div>

              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 ${setupStatus.policiesExist ? "text-green-600" : "text-red-600"}`}>
                  {setupStatus.policiesExist ? <CheckCircle2 /> : <XCircle />}
                </div>
                <span>Row Level Security Policies</span>
              </div>

              <div className="flex items-center">
                <div className={`mr-2 h-5 w-5 ${setupStatus.storageExists ? "text-green-600" : "text-red-600"}`}>
                  {setupStatus.storageExists ? <CheckCircle2 /> : <XCircle />}
                </div>
                <span>Storage Bucket</span>
              </div>
            </div>
          </CardContent>
          {(!setupStatus.tablesExist || !setupStatus.policiesExist || !setupStatus.storageExists) &&
            !setupStatus.checking && (
              <CardFooter>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <p className="mb-2">Run the setup SQL script in your Supabase SQL editor:</p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          "https://github.com/your-repo/swyft-agent/blob/main/scripts/production-setup-complete.sql",
                          "_blank",
                        )
                      }
                    >
                      View Setup Script
                    </Button>
                  </AlertDescription>
                </Alert>
              </CardFooter>
            )}
        </Card>

        {setupStatus.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Error during setup check:</p>
              <p>{setupStatus.error}</p>
            </AlertDescription>
          </Alert>
        )}

        {setupStatus.supabaseConnected &&
          setupStatus.tablesExist &&
          setupStatus.policiesExist &&
          setupStatus.storageExists && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold">All systems ready!</p>
                <p>Your Swyft Agent application is properly configured and ready to use.</p>
              </AlertDescription>
            </Alert>
          )}
      </div>
    </div>
  )
}
