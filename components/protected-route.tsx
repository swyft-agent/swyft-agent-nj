"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { getUserRBACContext, canAccessRoute, type RBACUser } from "@/lib/rbac"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoute?: string
  fallbackRoute?: string
}

export function ProtectedRoute({ children, requiredRoute, fallbackRoute = "/" }: ProtectedRouteProps) {
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [rbacUser, setRbacUser] = useState<RBACUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      if (authLoading) return

      if (!authUser) {
        router.push("/login")
        return
      }

      try {
        // Get user's RBAC context
        const rbacContext = await getUserRBACContext(authUser.id)
        setRbacUser(rbacContext)

        // Check route access if required
        if (requiredRoute && rbacContext) {
          const hasAccess = canAccessRoute(rbacContext, requiredRoute)
          if (!hasAccess) {
            setAccessDenied(true)
            setLoading(false)
            return
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error checking route access:", error)
        setLoading(false)
      }
    }

    checkAccess()
  }, [authUser, authLoading, requiredRoute, router])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Contact your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => router.push(fallbackRoute)}>Go to Dashboard</Button>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
