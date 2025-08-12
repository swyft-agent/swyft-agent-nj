export function shouldShowSampleData(): boolean {
  if (typeof window === "undefined") return false

  // Only show sample data in very specific development scenarios
  const hostname = window.location.hostname
  const isDev = hostname === "localhost" || hostname === "127.0.0.1"
  const isPreview = hostname.includes("vusercontent.net") || hostname.includes("v0.dev")

  // Only show in local development, never in production or preview
  return isDev && process.env.NODE_ENV === "development"
}

export function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return false

  const hostname = window.location.hostname
  return hostname.includes("vusercontent.net") || hostname.includes("v0.dev")
}

export function isProductionEnvironment(): boolean {
  if (typeof window === "undefined") return true

  const hostname = window.location.hostname
  return (
    !hostname.includes("localhost") &&
    !hostname.includes("127.0.0.1") &&
    !hostname.includes("vusercontent.net") &&
    !hostname.includes("v0.dev")
  )
}
