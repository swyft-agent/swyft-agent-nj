"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!token_hash || type !== "email") {
          setStatus("error")
          setMessage("Invalid confirmation link")
          return
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email",
        })

        if (error) {
          console.error("Email confirmation error:", error)
          setStatus("error")
          setMessage(error.message || "Failed to confirm email")
        } else {
          console.log("Email confirmed successfully:", data)
          setStatus("success")
          setMessage("Your email has been confirmed successfully!")

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login")
          }, 3000)
        }
      } catch (error: any) {
        console.error("Email confirmation exception:", error)
        setStatus("error")
        setMessage("An unexpected error occurred")
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Confirmation</CardTitle>
          <CardDescription>Confirming your email address...</CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
              <p className="text-gray-600">Confirming your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600">Redirecting to login page...</p>
              <Button onClick={() => router.push("/login")} className="w-full bg-green-600 hover:bg-green-700">
                Go to Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <XCircle className="h-8 w-8 mx-auto text-red-600" />
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
