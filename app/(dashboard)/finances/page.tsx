"use client"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function FinancesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>M-Pesa Integration Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please integrate M-Pesa to have a complete financial overview of your properties.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
