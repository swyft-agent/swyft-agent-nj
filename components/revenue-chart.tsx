"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

const monthlyData = [
  { month: "Jan", revenue: 45000, commission: 4500, growth: 8.2 },
  { month: "Feb", revenue: 52000, commission: 5200, growth: 15.6 },
  { month: "Mar", revenue: 48000, commission: 4800, growth: -7.7 },
  { month: "Apr", revenue: 61000, commission: 6100, growth: 27.1 },
  { month: "May", revenue: 55000, commission: 5500, growth: -9.8 },
  { month: "Jun", revenue: 67000, commission: 6700, growth: 21.8 },
]

export function RevenueChart() {
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue))
  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]
  const monthlyGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue and commission trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-[200px] flex items-end justify-between gap-2 p-4 bg-muted/20 rounded-lg">
            {monthlyData.map((data, index) => {
              const revenueHeight = (data.revenue / maxRevenue) * 160
              const commissionHeight = (data.commission / maxRevenue) * 160

              return (
                <div key={data.month} className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex items-end gap-1 h-40 relative group">
                    {/* Revenue bar */}
                    <div
                      className="bg-primary rounded-t-sm min-w-[8px] transition-all duration-500 ease-out hover:bg-primary/80 cursor-pointer"
                      style={{ height: `${revenueHeight}px` }}
                      title={`Revenue: KSh ${data.revenue.toLocaleString()}`}
                    />
                    {/* Commission bar */}
                    <div
                      className="bg-primary/60 rounded-t-sm min-w-[8px] transition-all duration-500 ease-out hover:bg-primary/40 cursor-pointer"
                      style={{ height: `${commissionHeight}px` }}
                      title={`Commission: KSh ${data.commission.toLocaleString()}`}
                    />
                    {/* Growth indicator */}
                    {data.growth !== undefined && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className={`flex items-center text-xs px-1 py-0.5 rounded ${
                            data.growth > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {data.growth > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(data.growth).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{data.month}</span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-primary rounded"></div>
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-primary/60 rounded"></div>
              <span>Commission</span>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">KSh {currentMonth.revenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary/80">KSh {currentMonth.commission.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Commission</div>
            </div>
            <div className="text-center">
              <div
                className={`text-xl font-bold flex items-center justify-center gap-1 ${
                  monthlyGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {monthlyGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(monthlyGrowth).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Growth</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
