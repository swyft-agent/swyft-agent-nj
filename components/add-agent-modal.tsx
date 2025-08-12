"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Loader2, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddAgentModalProps {
  onAgentAdded?: () => void
  trigger?: React.ReactNode
}

export function AddAgentModal({ onAgentAdded, trigger }: AddAgentModalProps) {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverConfigError, setServerConfigError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [isOwner, setIsOwner] = useState(false)

  const resolveCompanyId = async () => {
    if (!authUser?.id) {
      toast({ title: "Error", description: "No authenticated user found.", variant: "destructive" })
      return null
    }

    try {
      setLoadingCompany(true)
      const { data, error } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", authUser.id)
        .maybeSingle()

      if (error) throw error

      const resolvedCompanyId = data?.company_account_id
      if (!resolvedCompanyId) {
        toast({
          title: "No company account found",
          description: "Please ensure you're logged in with a valid company account.",
          variant: "destructive",
        })
        return null
      }

      setCompanyId(resolvedCompanyId)
      return resolvedCompanyId
    } catch (e) {
      console.error("Error resolving company ID:", e)
      toast({
        title: "Error",
        description: "Unable to resolve company context.",
        variant: "destructive",
      })
      return null
    } finally {
      setLoadingCompany(false)
    }
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let result = ""
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(result)
  }

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !companyId) {
      await resolveCompanyId()
    }
    if (!newOpen) {
      // Reset form when closing
      setEmail("")
      setPassword("")
      setName("")
      setPhone("")
      setAddress("")
      setDescription("")
      setIsOwner(false)
      setServerConfigError(null)
      setShowPassword(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerConfigError(null)

    const currentCompanyId = companyId || (await resolveCompanyId())
    if (!currentCompanyId) {
      return
    }

    if (!email || !password || !name || !phone) {
      toast({
        title: "Missing fields",
        description: "Email, password, name and phone are required.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      console.log("Submitting agent creation request...")

      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
          address: address || null,
          description: description || null,
          role: "agent",
          is_company_owner: isOwner,
          company_account_id: currentCompanyId,
        }),
      })

      const json = await res.json()
      console.log("API response:", { status: res.status, ok: res.ok, error: json?.error })

      if (!res.ok) {
        if (res.status === 500 && typeof json?.error === "string" && json.error.includes("Server is not configured")) {
          setServerConfigError(json.error)
        }
        throw new Error(json?.error || "Failed to create user")
      }

      toast({
        title: "Agent added successfully",
        description: `${name} can now login with email: ${email} and the password you set.`,
      })
      setOpen(false)
      onAgentAdded?.()
    } catch (e: any) {
      console.error("Error creating agent:", e)
      toast({
        title: "Error creating agent",
        description: e?.message ?? "Failed to add agent.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Agent</DialogTitle>
          <DialogDescription>Create a new agent account with login credentials for your company</DialogDescription>
        </DialogHeader>

        {serverConfigError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverConfigError}</AlertDescription>
          </Alert>
        )}

        {loadingCompany ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Resolving company account...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="agent-email">Email *</Label>
              <Input
                id="agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@company.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-password">Password *</Label>
              <div className="relative">
                <Input
                  id="agent-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
                  Generate Password
                </Button>
                <span className="text-xs text-muted-foreground self-center">Minimum 6 characters</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-name">Full Name *</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-phone">Phone *</Label>
              <Input
                id="agent-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-address">Address</Label>
              <Input
                id="agent-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical address"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-description">Description</Label>
              <Input
                id="agent-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="agent-owner"
                checked={isOwner}
                onCheckedChange={(checked) => setIsOwner(Boolean(checked))}
              />
              <Label htmlFor="agent-owner">Mark as company owner</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
