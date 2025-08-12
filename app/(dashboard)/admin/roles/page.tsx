"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/protected-route"
import { Loader2, UserPlus, Settings, Trash2, Crown, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AccessLevel = "none" | "read" | "write" | "delete" | "manage" | "admin"
type Module =
  | "properties"
  | "tenants"
  | "leases"
  | "payments"
  | "maintenance_requests"
  | "reports"
  | "company_settings"
  | "user_management"

interface UserWithAccess {
  id: string
  email: string
  name: string
  phone: string
  role?: string
  is_company_owner?: boolean
  access?: Array<{ [key: string]: AccessLevel[] }>
  created_at: string
}

const modules: { key: Module; label: string; description: string }[] = [
  { key: "properties", label: "Properties", description: "Buildings, units, and property management" },
  { key: "tenants", label: "Tenants", description: "Tenant profiles and information" },
  { key: "leases", label: "Leases", description: "Lease agreements and notices" },
  { key: "payments", label: "Payments", description: "Financial transactions and invoicing" },
  { key: "maintenance_requests", label: "Maintenance", description: "Maintenance requests and tracking" },
  { key: "reports", label: "Reports", description: "Analytics and reporting" },
  { key: "company_settings", label: "Company Settings", description: "Company configuration and branding" },
  { key: "user_management", label: "User Management", description: "User roles and permissions" },
]

const accessLevels: { key: AccessLevel; label: string; description: string }[] = [
  { key: "none", label: "None", description: "No access" },
  { key: "read", label: "Read", description: "View only" },
  { key: "write", label: "Write", description: "Create and edit" },
  { key: "delete", label: "Delete", description: "Remove records" },
  { key: "manage", label: "Manage", description: "Full module control" },
  { key: "admin", label: "Admin", description: "System administration" },
]

export default function RolesPage() {
  return (
    <ProtectedRoute requiredRoute="/admin/roles">
      <RolesPageContent />
    </ProtectedRoute>
  )
}

function RolesPageContent() {
  const { user: authUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserWithAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithAccess | null>(null)
  const [saving, setSaving] = useState(false)

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserAddress, setNewUserAddress] = useState("")
  const [newUserDescription, setNewUserDescription] = useState("")
  const [newUserRole, setNewUserRole] = useState<"landlord" | "agent" | "manager" | "admin">("agent")
  const [newUserIsOwner, setNewUserIsOwner] = useState(false)

  // Permission assignment state
  const [userPermissions, setUserPermissions] = useState<{ [key in Module]: AccessLevel[] }>({
    properties: [],
    tenants: [],
    leases: [],
    payments: [],
    maintenance_requests: [],
    reports: [],
    company_settings: [],
    user_management: [],
  })

  const fetchUsers = async () => {
    if (!authUser?.id) return

    try {
      // Get current user's company
      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", authUser.id)
        .single()

      if (currentUserError) throw currentUserError

      // Fetch all users in the same company
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, phone, role, is_company_owner, access, created_at")
        .eq("company_account_id", currentUser.company_account_id)
        .order("created_at", { ascending: true })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [authUser])

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let result = ""
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewUserPassword(result)
  }

  const handleCreateUser = async () => {
    if (!authUser?.id) return

    if (!newUserEmail || !newUserPassword || !newUserName || !newUserPhone) {
      toast({
        title: "Missing fields",
        description: "Email, password, name, and phone are required",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      // Get current user's company
      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", authUser.id)
        .single()

      if (currentUserError) throw currentUserError

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          phone: newUserPhone,
          address: newUserAddress || null,
          description: newUserDescription || null,
          role: newUserRole,
          is_company_owner: newUserIsOwner,
          company_account_id: currentUser.company_account_id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user")
      }

      toast({
        title: "User created",
        description: `${newUserName} can now login with their credentials`,
      })

      // Reset form
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserName("")
      setNewUserPhone("")
      setNewUserAddress("")
      setNewUserDescription("")
      setNewUserRole("agent")
      setNewUserIsOwner(false)
      setCreateDialogOpen(false)

      // Refresh users list
      fetchUsers()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAssignRole = (user: UserWithAccess) => {
    setSelectedUser(user)

    // Initialize permissions from user's current access
    const currentPermissions: { [key in Module]: AccessLevel[] } = {
      properties: [],
      tenants: [],
      leases: [],
      payments: [],
      maintenance_requests: [],
      reports: [],
      company_settings: [],
      user_management: [],
    }

    if (user.access && Array.isArray(user.access)) {
      user.access.forEach((accessObj) => {
        if (typeof accessObj === "object" && accessObj !== null) {
          Object.keys(accessObj).forEach((module) => {
            if (module in currentPermissions) {
              currentPermissions[module as Module] = accessObj[module] || []
            }
          })
        }
      })
    }

    setUserPermissions(currentPermissions)
    setAssignDialogOpen(true)
  }

  const handlePermissionChange = (module: Module, level: AccessLevel, checked: boolean) => {
    setUserPermissions((prev) => ({
      ...prev,
      [module]: checked ? [...prev[module], level] : prev[module].filter((l) => l !== level),
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    try {
      setSaving(true)

      // Convert permissions to the expected format
      const accessArray = [userPermissions]

      const { error } = await supabase.from("users").update({ access: accessArray }).eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "Permissions updated",
        description: `${selectedUser.name}'s permissions have been updated`,
      })

      setAssignDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClearAccess = async (user: UserWithAccess) => {
    try {
      const { error } = await supabase.from("users").update({ access: null }).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Access cleared",
        description: `${user.name}'s custom permissions have been removed`,
      })

      fetchUsers()
    } catch (error) {
      console.error("Error clearing access:", error)
      toast({
        title: "Error",
        description: "Failed to clear access",
        variant: "destructive",
      })
    }
  }

  const getAccessSummary = (user: UserWithAccess) => {
    if (user.is_company_owner) return "Full Access (Owner)"

    if (!user.access || !Array.isArray(user.access) || user.access.length === 0) {
      return user.role ? `Default (${user.role})` : "No Access"
    }

    const hasAdmin = user.access.some(
      (accessObj) =>
        typeof accessObj === "object" &&
        accessObj !== null &&
        Object.values(accessObj).some((levels) => Array.isArray(levels) && levels.includes("admin")),
    )

    if (hasAdmin) return "System Admin"

    const moduleCount = user.access.reduce((count, accessObj) => {
      if (typeof accessObj === "object" && accessObj !== null) {
        return count + Object.keys(accessObj).length
      }
      return count
    }, 0)

    return `Custom (${moduleCount} modules)`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user access levels and permissions for your organization</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>View and manage permissions for all users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.is_company_owner && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Owner
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role || "No Role"}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getAccessSummary(user)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignRole(user)}
                        disabled={user.is_company_owner && user.id !== authUser?.id}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {user.access && !user.is_company_owner && (
                        <Button variant="outline" size="sm" onClick={() => handleClearAccess(user)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new team member with login credentials</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-password">Password *</Label>
                <div className="flex gap-2">
                  <Input
                    id="create-password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Secure password"
                  />
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Full Name *</Label>
                <Input
                  id="create-name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-phone">Phone *</Label>
                <Input
                  id="create-phone"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-address">Address</Label>
              <Input
                id="create-address"
                value={newUserAddress}
                onChange={(e) => setNewUserAddress(e.target.value)}
                placeholder="Physical address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={newUserDescription}
                onChange={(e) => setNewUserDescription(e.target.value)}
                placeholder="Additional notes"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-role">Role</Label>
                <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="create-owner"
                  checked={newUserIsOwner}
                  onCheckedChange={(checked) => setNewUserIsOwner(Boolean(checked))}
                />
                <Label htmlFor="create-owner">Company Owner</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Permissions</DialogTitle>
            <DialogDescription>Set module-specific access levels for {selectedUser?.name}</DialogDescription>
          </DialogHeader>

          {selectedUser?.is_company_owner && selectedUser.id !== authUser?.id && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Company owners have full system access and cannot be modified by other users.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 py-4">
            {modules.map((module) => (
              <div key={module.key} className="space-y-3">
                <div>
                  <h4 className="font-medium">{module.label}</h4>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {accessLevels.map((level) => (
                    <div key={level.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${module.key}-${level.key}`}
                        checked={userPermissions[module.key]?.includes(level.key) || false}
                        onCheckedChange={(checked) => handlePermissionChange(module.key, level.key, Boolean(checked))}
                        disabled={selectedUser?.is_company_owner && selectedUser.id !== authUser?.id}
                      />
                      <Label htmlFor={`${module.key}-${level.key}`} className="text-sm font-normal">
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={saving || (selectedUser?.is_company_owner && selectedUser.id !== authUser?.id)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
