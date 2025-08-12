"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Smartphone, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

export default function DepositPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    amount: "",
    phone_number: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const amount = Number.parseFloat(formData.amount)
      if (amount < 10) {
        throw new Error("Minimum deposit amount is KSh 10")
      }

      if (!formData.phone_number.match(/^254\d{9}$/)) {
        throw new Error("Please enter a valid phone number (254XXXXXXXXX)")
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("company_account_id")
        .eq("id", user?.id)
        .single()

      if (userError) throw userError

      // Simulate M-Pesa STK Push
      const { data, error } = await supabase.from("wallet_transactions").insert([
        {
          company_account_id: userData.company_account_id,
          type: "deposit",
          amount: amount,
          description: `M-Pesa deposit from ${formData.phone_number}`,
          status: "pending",
          reference: `MP${Date.now()}`,
          phone_number: formData.phone_number,
        },
      ])

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/wallet")
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 bg-white min-h-screen p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Deposit Initiated</h2>
              <p className="text-gray-600 mb-4">
                Please check your phone for the M-Pesa prompt and enter your PIN to complete the transaction.
              </p>
              <p className="text-sm text-gray-500">You will be redirected to your wallet in a few seconds...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/wallet">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wallet
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deposit via M-Pesa</h1>
          <p className="text-gray-600 mt-1">Add money to your wallet using M-Pesa</p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              M-Pesa Deposit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="amount">Amount (KSh) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100"
                  min="10"
                  max="150000"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Minimum: KSh 10 | Maximum: KSh 150,000</p>
              </div>

              <div>
                <Label htmlFor="phone_number">M-Pesa Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="254712345678"
                  pattern="254[0-9]{9}"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Enter your M-Pesa registered phone number (254XXXXXXXXX)</p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You will receive an M-Pesa prompt on your phone. Enter your M-Pesa PIN to complete the transaction.
                </AlertDescription>
              </Alert>

              <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? "Processing..." : "Initiate M-Pesa Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
