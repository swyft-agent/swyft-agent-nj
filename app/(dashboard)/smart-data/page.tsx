"use client"

import { SmartUpload } from "@/components/smart-upload"
import { UploadHistory } from "@/components/upload-history"

export default function SmartDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Smart Data Ingestion</h2>
        <p className="text-gray-600">
          Upload CSV or Excel files and let AI automatically detect and organize your property management data.
        </p>
      </div>

      <SmartUpload />
      <UploadHistory />
    </div>
  )
}
