// Image upload utility for Supabase storage
import { supabase } from "./supabase"

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export class ImageUploadManager {
  private static readonly BUCKET_NAME = "property-images"
  private static readonly VACANT_FOLDER = "vacants"

  static async uploadVacantUnitImage(file: File, unitId: string, companyId: string): Promise<UploadResult> {
    try {
      // Validate file
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "File must be an image" }
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        return { success: false, error: "File size must be less than 5MB" }
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${companyId}/${unitId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${this.VACANT_FOLDER}/${fileName}`

      console.log("📤 Uploading image:", filePath)

      // Upload to Supabase storage
      const { data, error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath)

      console.log("✅ Image uploaded successfully:", urlData.publicUrl)

      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error: any) {
      console.error("Upload exception:", error)
      return { success: false, error: error.message }
    }
  }

  static async uploadMultipleImages(
    files: File[],
    unitId: string,
    companyId: string,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await this.uploadVacantUnitImage(file, unitId, companyId)
      results.push(result)

      // Report progress
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100)
      }
    }

    return results
  }

  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split("/")
      const bucketIndex = urlParts.findIndex((part) => part === this.BUCKET_NAME)
      if (bucketIndex === -1) return false

      const filePath = urlParts.slice(bucketIndex + 1).join("/")

      const { error } = await supabase.storage.from(this.BUCKET_NAME).remove([filePath])

      if (error) {
        console.error("Delete error:", error)
        return false
      }

      console.log("🗑️ Image deleted:", filePath)
      return true
    } catch (error) {
      console.error("Delete exception:", error)
      return false
    }
  }

  // New generic upload method for any file
  static async uploadFile(bucketName: string, filePath: string, file: File): Promise<UploadResult> {
    try {
      const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error(`Upload error for ${filePath}:`, error)
        return { success: false, error: error.message }
      }

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error: any) {
      console.error(`Upload exception for ${filePath}:`, error)
      return { success: false, error: error.message }
    }
  }
}
