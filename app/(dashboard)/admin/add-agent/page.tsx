"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Loader2, UserPlus, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AddAgentPage() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [saving, setSaving] = useState(false)
  const [serverConfigError, setServerConfigError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingCompany(true)
        if (!authUser?.id) return
        const { data, error } = await supabase
          .from("users")
          .select("company_account_id")
          .eq("id", authUser.id)
          .maybeSingle()
        if (error) throw error
        setCompanyId(data?.company_account_id ?? null)
      } catch (e) {
        console.error(e)
        toast({
          title: "Error",
          description: "Unable to resolve company context.",
          variant: "destructive",
        })
      } finally {
        setLoadingCompany(false)
      }
    }
    run()
  }, [authUser?.id, toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerConfigError(null)
    if (!companyId) {
      toast({ title: "Error", description: "Missing company account context.", variant: "destructive" })
      return
    }
    if (!email || !name || !phone) {
      toast({ title: "Missing fields", description: "Email, name and phone are required.", variant: "destructive" })
      return
    }
    try {
      setSaving(true)
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          address: address || null,
          description: description || null,
          role: "agent",
          is_company_owner: isOwner,
          company_account_id: companyId,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 500 && typeof json?.error === "string" && json.error.includes("Server is not configured")) {
          setServerConfigError(
            "Server is not configured for admin operations. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on the server.",
          )
        }
        throw new Error(json?.error || "Failed to create user")
      }
      toast({ title: "Agent added", description: `${email} has been invited/created.` })
      setEmail("")
      setName("")
      setPhone("")
      setAddress("")
      setDescription("")
      setIsOwner(false)
    } catch (e: any) {
      toast({ title: "Error creating user", description: e?.message ?? "Failed to add agent.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full">
      <Card className="max-w-2xl mx-auto border-none shadow-sm">
        <CardHeader>
          <CardTitle>Add Agent</CardTitle>
          <CardDescription>Create a new agent for your company</CardDescription>
        </CardHeader>
        <CardContent>
          {serverConfigError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverConfigError}</AlertDescription>
            </Alert>
          )}
          {loadingCompany ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resolving company...
            </div>
          ) : !companyId ? (
            <div className="text-sm text-red-600">Missing company account context.</div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="owner" checked={isOwner} onCheckedChange={(c) => setIsOwner(Boolean(c))} />
                <Label htmlFor="owner">Mark as company owner</Label>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Agent
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
