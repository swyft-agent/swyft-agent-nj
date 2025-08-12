"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react"

// Update the props interface to include database fields and manual save
interface ExcelImportProps {
  onImport: (data: any[]) => void
  templateColumns?: string[]
  tableName?: string
  onSaveToDatabase?: (data: any[]) => Promise<boolean>
  databaseFields?: { name: string; required: boolean; type: string }[]
}

// Update the component function signature
export function ExcelImport({
  onImport,
  templateColumns = [],
  tableName = "data",
  onSaveToDatabase,
  databaseFields = [],
}: ExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [actualColumns, setActualColumns] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && tableName.toLowerCase() === "tenants") {
      const fetchTableStructure = async () => {
        try {
          const { supabase } = await import("@/lib/supabase")
          const { data, error } = await supabase.rpc("get_table_structure", { table_name: "tenants" })
          if (data && !error) {
            // Update template columns based on actual table structure
            const columns = data.map((col: any) => col.column_name)
            if (columns.length > 0) {
              // Filter out system columns
              const filteredColumns = columns.filter((col: string) => !["id", "created_at", "updated_at"].includes(col))
              // Use these columns for the template
              if (filteredColumns.length > 0) {
                setActualColumns(filteredColumns)
              }
            }
          }
        } catch (err) {
          console.error("Error fetching table structure:", err)
        }
      }
      fetchTableStructure()
    }
  }, [isOpen, tableName])

  // Update the downloadTemplate function to use database fields if available
  const downloadTemplate = () => {
    try {
      // Use actual columns from database if available, otherwise use provided columns or defaults
      let columns = actualColumns.length > 0 ? actualColumns : templateColumns.length > 0 ? templateColumns : []

      if (columns.length === 0 && databaseFields.length > 0) {
        columns = databaseFields.map((field) => field.name)
      }

      if (columns.length === 0) {
        columns = ["name", "email", "phone", "unit", "building"]
      }

      // Create CSV content with header row
      const csvContent = columns.join(",") + "\n"

      // Create a download link
      const element = document.createElement("a")
      const fileBlob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(fileBlob)

      // Set up download attributes
      element.href = url
      element.download = `${tableName}_template.csv`

      // Trigger download
      document.body.appendChild(element)
      element.click()

      // Clean up
      document.body.removeChild(element)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error downloading template:", err)
      setError("Failed to download template")
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError("")
      setSuccess(false)
    }
  }

  const parseCSV = (text: string): any[] => {
    try {
      // Split by lines and filter empty lines
      const lines = text.split("\n").filter((line) => line.trim())
      if (lines.length < 2) return []

      // Get headers from first line
      const headers = lines[0].split(",").map((h) => h.trim())
      const data = []

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        const row: any = {}

        // Map each value to its corresponding header
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })

        // Only add non-empty rows
        if (Object.values(row).some((val) => val !== "")) {
          data.push(row)
        }
      }

      return data
    } catch (err) {
      console.error("Error parsing CSV:", err)
      throw new Error("Failed to parse CSV file")
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)
    setError("")

    try {
      // Read file content
      const text = await file.text()

      // Parse CSV data
      const data = parseCSV(text)

      if (data.length === 0) {
        throw new Error("No valid data found in file")
      }

      // Simulate progress for better UX
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Call the import function with parsed data
      onImport(data)

      setSuccess(true)

      // Close dialog after successful import
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setProgress(0)
        setFile(null)
      }, 1000)
    } catch (err: any) {
      console.error("Import error:", err)
      setError(err.message || "Failed to import data")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex justify-between items-center p-6 pb-2">
          <div>
            <h2 className="text-xl font-semibold">Import {tableName}</h2>
            <p className="text-sm text-gray-500">Upload a CSV file to import {tableName.toLowerCase()} data in bulk.</p>
          </div>
          <DialogClose className="h-6 w-6 rounded-md hover:bg-gray-100">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <div className="p-6 pt-2 space-y-5">
          {/* Template Download */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="bg-green-100 p-2 rounded-md">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Download Template</h3>
              <p className="text-sm text-gray-500">Get the correct format for your data</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <h3 className="text-sm font-medium mb-2">Select CSV File</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-32 justify-start"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Choose File
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={importing}
              />
              <span className="text-sm text-gray-500">{file ? file.name : "No file selected"}</span>
            </div>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Selected: {file.name}</span>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-100" />
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border-green-200 p-4 rounded-md flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-green-800">File imported successfully! Review and save on the main page.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-red-200 p-4 rounded-md flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={importing}>
              Cancel
            </Button>

            {file && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? "Processing..." : "Import & Continue"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
