"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreditCard, DollarSign, TrendingUp, TrendingDown, Smartphone, AlertCircle } from "lucide-react"

export default function FinancesPage() {
  const [showMpesaDialog, setShowMpesaDialog] = useState(true)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">Track your property finances and transactions</p>
        </div>
      </div>

      {/* M-Pesa Integration Dialog */}
      <Dialog open={showMpesaDialog} onOpenChange={setShowMpesaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              M-Pesa Integration Required
            </DialogTitle>
            <DialogDescription>
              Please integrate M-Pesa to have a complete financial overview of your properties.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg">
              <div className="text-center">
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700">
                  Connect your M-Pesa account to track payments, expenses, and generate financial reports.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={() => setShowMpesaDialog(false)}>
                Integrate M-Pesa
              </Button>
              <Button variant="outline" onClick={() => setShowMpesaDialog(false)}>
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placeholder Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Requires M-Pesa integration</p>
          </CardContent>
        </Card>
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Requires M-Pesa integration</p>
          </CardContent>
        </Card>
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Requires M-Pesa integration</p>
          </CardContent>
        </Card>
        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">Requires M-Pesa integration</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            Financial Data Unavailable
          </CardTitle>
          <CardDescription className="text-orange-700">
            Connect your M-Pesa account to view detailed financial analytics, transaction history, and generate reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-green-600 hover:bg-green-700">
            <Smartphone className="mr-2 h-4 w-4" />
            Integrate M-Pesa Now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
