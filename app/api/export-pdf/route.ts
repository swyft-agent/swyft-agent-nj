import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Get the current user
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate PDF content as HTML (simplified version)
    const htmlContent = generatePDFContent(type, data)

    // Convert HTML to PDF buffer (simplified - in production you'd use puppeteer or similar)
    const pdfBuffer = Buffer.from(htmlContent, "utf-8")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-report-${data.selectedYear}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}

function generatePDFContent(type: string, data: any): string {
  // This is a simplified PDF generation - in production you'd use a proper PDF library
  const { metrics, revenueData, selectedYear, buildingName } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${type.toUpperCase()} Report - ${selectedYear}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .metric { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Revenue Report - ${selectedYear}</h1>
        <h2>${buildingName}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="metrics">
        <div class="metric">
          <h3>Total Revenue</h3>
          <p>KES ${metrics.totalRevenue?.toLocaleString() || "0"}</p>
        </div>
        <div class="metric">
          <h3>Net Profit</h3>
          <p>KES ${metrics.netProfit?.toLocaleString() || "0"}</p>
        </div>
        <div class="metric">
          <h3>Total Buildings</h3>
          <p>${metrics.totalBuildings || 0}</p>
        </div>
        <div class="metric">
          <h3>Average Occupancy</h3>
          <p>${metrics.averageOccupancy || 0}%</p>
        </div>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Revenue (KES)</th>
            <th>Expenses (KES)</th>
            <th>Profit (KES)</th>
            <th>Occupancy (%)</th>
          </tr>
        </thead>
        <tbody>
          ${
            revenueData
              ?.map(
                (row: any) => `
            <tr>
              <td>${row.month}</td>
              <td>${row.revenue?.toLocaleString() || "0"}</td>
              <td>${row.expenses?.toLocaleString() || "0"}</td>
              <td>${row.profit?.toLocaleString() || "0"}</td>
              <td>${row.occupancy || 0}%</td>
            </tr>
          `,
              )
              .join("") || ""
          }
        </tbody>
      </table>
    </body>
    </html>
  `
}
