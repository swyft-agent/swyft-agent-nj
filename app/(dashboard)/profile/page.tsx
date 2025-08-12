"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Mail, Phone, MapPin, Building, Camera, Save, Users, Crown, Shield } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase, isUsingMockData } from "@/lib/supabase"
import { getCachedData, CACHE_KEYS, appCache } from "@/lib/cache"

interface CompanyUser {
  id: string
  name: string
  email: string
  phone: string
  role: string
  is_company_owner: boolean
  created_at: string
}

export default function ProfilePage() {
  const { profile, company, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    role: "",
  })
  const [companyData, setCompanyData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    company_size: "",
    subscription_plan: "",
    is_active: true,
  })
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])

  const [notifications, setNotifications] = useState({
    emailInquiries: true,
    emailNotices: true,
    emailMoves: false,
    pushInquiries: true,
    pushNotices: true,
    pushMoves: true,
    smsUrgent: true,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Fetch company users with caching
  const fetchCompanyUsers = async () => {
    if (!user?.company_account_id || isUsingMockData) return []

    return getCachedData(
      CACHE_KEYS.COMPANY_USERS(user.company_account_id),
      async () => {
        const { data, error } = await supabase
          .from("users")
          .select("id, name, email, phone, role, is_company_owner, created_at")
          .eq("company_account_id", user.company_account_id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching company users:", error)
          return []
        }

        return data || []
      },
      10 * 60 * 1000, // 10 minutes cache
    )
  }

  // Fetch company details with caching
  const fetchCompanyDetails = async () => {
    if (!user?.company_account_id || isUsingMockData) return null

    return getCachedData(
      CACHE_KEYS.COMPANY_DETAILS(user.company_account_id),
      async () => {
        const { data, error } = await supabase
          .from("company_accounts")
          .select("*")
          .eq("id", user.company_account_id)
          .single()

        if (error) {
          console.error("Error fetching company details:", error)
          return null
        }

        return data
      },
      10 * 60 * 1000, // 10 minutes cache
    )
  }

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        // Set profile data
        if (profile) {
          setProfileData({
            name: profile.name || profile.full_name || "",
            email: profile.email || user?.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
            description: profile.description || "",
            role: profile.role || "admin",
          })
        }

        // Fetch and set company data
        const companyDetails = await fetchCompanyDetails()
        if (companyDetails) {
          setCompanyData({
            company_name: companyDetails.company_name || "",
            contact_name: companyDetails.contact_name || "",
            email: companyDetails.email || "",
            phone: companyDetails.phone || "",
            address: companyDetails.address || "",
            description: companyDetails.description || "",
            company_size: companyDetails.company_size || "",
            subscription_plan: companyDetails.subscription_plan || "basic",
            is_active: companyDetails.is_active ?? true,
          })
        }

        // Fetch company users
        const users = await fetchCompanyUsers()
        setCompanyUsers(users)
      } catch (error) {
        console.error("Error loading profile data:", error)
      }
    }

    loadData()
  }, [user, profile])

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!profile || isUsingMockData) {
      alert("Profile updated successfully!")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          description: profileData.description,
        })
        .eq("id", profile.id)

      if (error) throw error

      // Invalidate cache
      appCache.invalidate(CACHE_KEYS.USER_PROFILE(profile.id))
      appCache.invalidate(CACHE_KEYS.COMPANY_USERS(user?.company_account_id || ""))

      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error updating profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    if (!company || isUsingMockData) {
      alert("Company information updated successfully!")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("company_accounts")
        .update({
          company_name: companyData.company_name,
          contact_name: companyData.contact_name,
          phone: companyData.phone,
          address: companyData.address,
          description: companyData.description,
          company_size: companyData.company_size,
        })
        .eq("id", company.id)

      if (error) throw error

      // Invalidate cache
      appCache.invalidate(CACHE_KEYS.COMPANY_DETAILS(company.id))

      alert("Company information updated successfully!")
    } catch (error) {
      console.error("Error updating company:", error)
      alert("Error updating company information")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = () => {
    console.log("Saving notifications:", notifications)
    alert("Notification preferences saved!")
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match")
      return
    }
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }
    console.log("Changing password")
    alert("Password changed successfully!")
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <Badge variant="default" className="bg-yellow-500">
          <Crown className="mr-1 h-3 w-3" />
          Owner
        </Badge>
      )
    }
    if (role === "admin") {
      return (
        <Badge variant="secondary">
          <Shield className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      )
    }
    return <Badge variant="outline">Agent</Badge>
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and company information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback className="text-lg">
                    {profileData.name
                      ? profileData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator />

              {/* Personal Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      className="pl-8"
                      value={profileData.name}
                      onChange={(e) => handleProfileChange("name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-8"
                      value={profileData.email}
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-8"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-8"
                      value={profileData.address}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about yourself..."
                    rows={3}
                    value={profileData.description}
                    onChange={(e) => handleProfileChange("description", e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">{getRoleBadge(profileData.role, profile?.is_company_owner || false)}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      className="pl-8"
                      value={companyData.company_name}
                      onChange={(e) => handleCompanyChange("company_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={companyData.contact_name}
                    onChange={(e) => handleCompanyChange("contact_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_phone">Company Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_phone"
                      type="tel"
                      className="pl-8"
                      value={companyData.phone}
                      onChange={(e) => handleCompanyChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <Input
                    id="company_size"
                    value={companyData.company_size}
                    onChange={(e) => handleCompanyChange("company_size", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_address">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_address"
                      className="pl-8"
                      value={companyData.address}
                      onChange={(e) => handleCompanyChange("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_description">Company Description</Label>
                  <Textarea
                    id="company_description"
                    placeholder="Tell us about your real estate business..."
                    rows={3}
                    value={companyData.description}
                    onChange={(e) => handleCompanyChange("description", e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Subscription Plan</Label>
                    <div className="mt-1">
                      <Badge variant={companyData.subscription_plan === "premium" ? "default" : "secondary"}>
                        {companyData.subscription_plan?.charAt(0).toUpperCase() +
                          companyData.subscription_plan?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <Badge variant={companyData.is_active ? "default" : "destructive"}>
                        {companyData.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Company Info"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Users */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Company Team Members
            </CardTitle>
            <CardDescription>All users associated with your company</CardDescription>
          </CardHeader>
          <CardContent>
            {companyUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "—"}</TableCell>
                      <TableCell>{getRoleBadge(user.role, user.is_company_owner)}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No team members found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to be notified about important events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Email Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New Inquiries</p>
                    <p className="text-xs text-muted-foreground">Get notified when tenants send new messages</p>
                  </div>
                  <Switch
                    checked={notifications.emailInquiries}
                    onCheckedChange={(checked) => handleNotificationChange("emailInquiries", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Move Notices</p>
                    <p className="text-xs text-muted-foreground">Get notified about move-in and move-out notices</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotices}
                    onCheckedChange={(checked) => handleNotificationChange("emailNotices", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Move Requests</p>
                    <p className="text-xs text-muted-foreground">Get notified about new move service requests</p>
                  </div>
                  <Switch
                    checked={notifications.emailMoves}
                    onCheckedChange={(checked) => handleNotificationChange("emailMoves", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-4">Push Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New Inquiries</p>
                    <p className="text-xs text-muted-foreground">Instant notifications for new messages</p>
                  </div>
                  <Switch
                    checked={notifications.pushInquiries}
                    onCheckedChange={(checked) => handleNotificationChange("pushInquiries", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Move Notices</p>
                    <p className="text-xs text-muted-foreground">Instant notifications for notices</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotices}
                    onCheckedChange={(checked) => handleNotificationChange("pushNotices", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Move Requests</p>
                    <p className="text-xs text-muted-foreground">Instant notifications for move requests</p>
                  </div>
                  <Switch
                    checked={notifications.pushMoves}
                    onCheckedChange={(checked) => handleNotificationChange("pushMoves", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-4">SMS Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Urgent Messages Only</p>
                    <p className="text-xs text-muted-foreground">Only receive SMS for urgent matters</p>
                  </div>
                  <Switch
                    checked={notifications.smsUrgent}
                    onCheckedChange={(checked) => handleNotificationChange("smsUrgent", checked)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleChangePassword}>Change Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
