"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Building,
  Settings,
  Bell,
  Sun,
  Globe,
  Calendar,
  Mail,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Zap,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  description: string | null
  role: string
  company_account_id: string | null
  is_company_owner: boolean
}

interface CompanyInfo {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  address: string | null
  description: string | null
  company_size: string | null
}

interface UserPreferences {
  theme: "light" | "dark" | "system"
  timezone: string
  language: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  reports: {
    frequency: "daily" | "weekly" | "monthly"
    auto_send: boolean
  }
}

interface IntegrationSettings {
  resend: {
    api_key: string
    from_email: string
    enabled: boolean
  }
  mpesa: {
    consumer_key: string
    consumer_secret: string
    shortcode: string
    passkey: string
    enabled: boolean
    is_registered: boolean
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "system",
    timezone: "Africa/Nairobi",
    language: "en",
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    reports: {
      frequency: "monthly",
      auto_send: false,
    },
  })
  const [integrations, setIntegrations] = useState<IntegrationSettings>({
    resend: {
      api_key: "",
      from_email: "",
      enabled: false,
    },
    mpesa: {
      consumer_key: "",
      consumer_secret: "",
      shortcode: "",
      passkey: "",
      enabled: false,
      is_registered: false
    },
  })

  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("id, name, email, phone, address, description, role, company_account_id, is_company_owner")
        .eq("id", user?.id)
        .single()

      if (profileError) throw profileError
      setUserProfile(profileData)

      // Load company info if user has a company
      if (profileData.company_account_id) {
        const { data: companyData, error: companyError } = await supabase
          .from("company_accounts")
          .select("id, company_name, contact_name, email, phone, address, description, company_size")
          .eq("id", profileData.company_account_id)
          .single()

        if (companyError) {
          console.error("Error loading company data:", companyError)
        } else {
          setCompanyInfo(companyData)
        }
      }

      // Load user preferences
      const { data: prefsData } = await supabase.from("user_preferences").select("*").eq("user_id", user?.id).single()

      if (prefsData) {
        setPreferences({
          theme: prefsData.theme || "system",
          timezone: prefsData.timezone || "Africa/Nairobi",
          language: prefsData.language || "en",
          notifications: prefsData.notifications || {
            email: true,
            push: true,
            sms: false,
          },
          reports: prefsData.reports || {
            frequency: "monthly",
            auto_send: false,
          },
        })
      }

      const integrationsResponse = await fetch(`https://swyft-agent-ser.onrender.com/api/get-integration-settings?user_id=${user?.id}`);

        if (integrationsResponse.ok) {
            const integrationsData = await integrationsResponse.json();
            
            // **CRITICAL FIX:** Safely merge the API data with your default state.
            setIntegrations(prevIntegrations => ({
                resend: {
                    ...prevIntegrations.resend,
                    ...(integrationsData.resend || {})
                },
                mpesa: {
                    ...prevIntegrations.mpesa,
                    ...(integrationsData.mpesa || {})
                }
            }));

        } else {
            console.error("Failed to fetch initial integration settings from API.");
            // Optional: Revert to default state if fetch fails
            setIntegrations({
                resend: { api_key: "", from_email: "", enabled: false },
                mpesa: { consumer_key: "", consumer_secret: "", shortcode: "", passkey: "", enabled: false, is_registered: false }
            });
        }
    } catch (error: any) {
      console.error("Error loading user data:", error)
      setMessage({ type: "error", text: error.message || "Failed to load user data" })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!userProfile) return

    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from("users")
        .update({
          name: userProfile.name,
          phone: userProfile.phone,
          address: userProfile.address,
          description: userProfile.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id)

      if (error) throw error

      setMessage({ type: "success", text: "Profile updated successfully" })
    } catch (error: any) {
      console.error("Error saving profile:", error)
      setMessage({ type: "error", text: error.message || "Failed to save profile" })
    } finally {
      setSaving(false)
    }
  }

  const saveCompany = async () => {
    if (!companyInfo || !userProfile?.company_account_id) return

    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from("company_accounts")
        .update({
          company_name: companyInfo.company_name,
          contact_name: companyInfo.contact_name,
          email: companyInfo.email,
          phone: companyInfo.phone,
          address: companyInfo.address,
          description: companyInfo.description,
          company_size: companyInfo.company_size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.company_account_id)

      if (error) throw error

      setMessage({ type: "success", text: "Company information updated successfully" })
    } catch (error: any) {
      console.error("Error saving company:", error)
      setMessage({ type: "error", text: error.message || "Failed to save company information" })
    } finally {
      setSaving(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user?.id,
        theme: preferences.theme,
        timezone: preferences.timezone,
        language: preferences.language,
        notifications: preferences.notifications,
        reports: preferences.reports,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setMessage({ type: "success", text: "Preferences saved successfully" })
    } catch (error: any) {
      console.error("Error saving preferences:", error)
      setMessage({ type: "error", text: error.message || "Failed to save preferences" })
    } finally {
      setSaving(false)
    }
  }

  const saveIntegrations = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch("https://swyft-agent-ser.onrender.com/api/save-integration-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id,
          integrations,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save integration settings")
      }

      const result = await response.json();
      if(result.mpesa){
        setIntegrations({
          ...integrations,
         mpesa:result.mpesa,
        });
        setMessage({ type: "success", text: "Integration settings saved successfully" });
      }else{
        setMessage({type:"success", text:result.message || "Settings saved"});
      }
      
    } catch (error: any) {
      console.error("Error saving integrations:", error)
      setMessage({ type: "error", text: error.message || "Failed to save integration settings" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account, company, and application preferences</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
            {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={userProfile.email} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={userProfile.phone || ""}
                          onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                          placeholder="+254 700 000 000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" value={userProfile.role} disabled className="bg-muted capitalize" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={userProfile.address || ""}
                        onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                        placeholder="Enter your address"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Bio/Description</Label>
                      <Textarea
                        id="description"
                        value={userProfile.description || ""}
                        onChange={(e) => setUserProfile({ ...userProfile, description: e.target.value })}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Manage your company details and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyInfo ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={companyInfo.company_name}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_name">Contact Person</Label>
                        <Input
                          id="contact_name"
                          value={companyInfo.contact_name}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, contact_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_email">Company Email</Label>
                        <Input
                          id="company_email"
                          type="email"
                          value={companyInfo.email}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_phone">Company Phone</Label>
                        <Input
                          id="company_phone"
                          value={companyInfo.phone || ""}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                          placeholder="+254 700 000 000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select
                        value={companyInfo.company_size || ""}
                        onValueChange={(value) => setCompanyInfo({ ...companyInfo, company_size: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="company_address">Company Address</Label>
                      <Textarea
                        id="company_address"
                        value={companyInfo.address || ""}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        placeholder="Enter company address"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_description">Company Description</Label>
                      <Textarea
                        id="company_description"
                        value={companyInfo.description || ""}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                        placeholder="Describe your company"
                        rows={3}
                      />
                    </div>

                    <Separator />

                    <Button onClick={saveCompany} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Company Info
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Company Information</h3>
                    <p className="text-muted-foreground">You are not associated with any company account.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>Customize your application experience and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Appearance
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={preferences.theme}
                        onValueChange={(value: any) => setPreferences({ ...preferences, theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Localization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="sw">Swahili</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={preferences.notifications.email}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, email: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={preferences.notifications.push}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, push: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Reports
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="report-frequency">Report Frequency</Label>
                      <Select
                        value={preferences.reports.frequency}
                        onValueChange={(value: any) =>
                          setPreferences({
                            ...preferences,
                            reports: { ...preferences.reports, frequency: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-send-reports">Auto-send Reports</Label>
                        <p className="text-sm text-muted-foreground">Automatically send reports to landlords</p>
                      </div>
                      <Switch
                        id="auto-send-reports"
                        checked={preferences.reports.auto_send}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            reports: { ...preferences.reports, auto_send: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>Configure third-party integrations for email and payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Resend Email Service
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="resend-enabled">Enable Resend</Label>
                        <p className="text-sm text-muted-foreground">Use Resend for sending emails</p>
                      </div>
                      <Switch
                        id="resend-enabled"
                        checked={integrations.resend.enabled}
                        onCheckedChange={(checked) =>
                          setIntegrations({
                            ...integrations,
                            resend: { ...integrations.resend, enabled: checked },
                          })
                        }
                      />
                    </div>
                    {integrations.resend.enabled && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="resend-api-key">API Key</Label>
                          <Input
                            id="resend-api-key"
                            type="password"
                            value={integrations.resend.api_key}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                resend: { ...integrations.resend, api_key: e.target.value },
                              })
                            }
                            placeholder="re_..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="resend-from-email">From Email</Label>
                          <Input
                            id="resend-from-email"
                            type="email"
                            value={integrations.resend.from_email}
                            onChange={(e) =>
                              setIntegrations({
                                ...integrations,
                                resend: { ...integrations.resend, from_email: e.target.value },
                              })
                            }
                            placeholder="noreply@yourdomain.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    M-Pesa Integration
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="mpesa-enabled">Enable M-Pesa</Label>
                        <p className="text-sm text-muted-foreground">Accept payments via M-Pesa</p>
                      </div>
                      <Switch
                        id="mpesa-enabled"
                        checked={integrations.mpesa.enabled && integrations.mpesa.is_registered}
                        onCheckedChange={(checked) =>{
                          if(!saving){
                            setIntegrations({
                              ...integrations,
                              mpesa: { ...integrations.mpesa, enabled: checked },
                            })
                          }
                        }}
                      />
                    </div>
                    {integrations.mpesa.enabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="mpesa-consumer-key">Consumer Key</Label>
                            <Input
                              id="mpesa-consumer-key"
                              type="password"
                              value={integrations.mpesa.consumer_key}
                              onChange={(e) =>
                                setIntegrations({
                                  ...integrations,
                                  mpesa: { ...integrations.mpesa, consumer_key: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="mpesa-consumer-secret">Consumer Secret</Label>
                            <Input
                              id="mpesa-consumer-secret"
                              type="password"
                              value={integrations.mpesa.consumer_secret}
                              onChange={(e) =>
                                setIntegrations({
                                  ...integrations,
                                  mpesa: { ...integrations.mpesa, consumer_secret: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="mpesa-shortcode">Shortcode</Label>
                            <Input
                              id="mpesa-shortcode"
                              value={integrations.mpesa.shortcode}
                              onChange={(e) =>
                                setIntegrations({
                                  ...integrations,
                                  mpesa: { ...integrations.mpesa, shortcode: e.target.value },
                                })
                              }
                              placeholder="174379"
                            />
                          </div>
                          <div>
                            <Label htmlFor="mpesa-passkey">Passkey</Label>
                            <Input
                              id="mpesa-passkey"
                              type="password"
                              value={integrations.mpesa.passkey}
                              onChange={(e) =>
                                setIntegrations({
                                  ...integrations,
                                  mpesa: { ...integrations.mpesa, passkey: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <Button onClick={saveIntegrations} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Integration Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
