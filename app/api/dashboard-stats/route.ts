import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Sample data - replace with actual database queries
    const stats = {
      totalBuildings: 12,
      totalUnits: 156,
      occupiedUnits: 142,
      vacantUnits: 14,
      monthlyRevenue: 8500000,
      pendingInquiries: 23,
      activeNotices: 5,
      maintenanceRequests: 8,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
