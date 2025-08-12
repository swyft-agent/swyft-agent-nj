"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const monthlyActivityData = [
  { month: "Jan", inquiries: 45, notices: 12, moves: 8 },
  { month: "Feb", inquiries: 52, notices: 18, moves: 12 },
  { month: "Mar", inquiries: 48, notices: 15, moves: 10 },
  { month: "Apr", inquiries: 61, notices: 22, moves: 15 },
  { month: "May", inquiries: 55, notices: 19, moves: 11 },
  { month: "Jun", inquiries: 67, notices: 25, moves: 18 },
]

export function AnalyticsChart() {
  const maxValue = Math.max(...monthlyActivityData.flatMap((d) => [d.inquiries, d.notices, d.moves]))

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Monthly Activity</CardTitle>
        <CardDescription>Inquiries, notices, and moves over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-[300px] flex items-end justify-between gap-2 p-4 bg-muted/20 rounded-lg">
            {monthlyActivityData.map((data, index) => {
              const inquiriesHeight = (data.inquiries / maxValue) * 240
              const noticesHeight = (data.notices / maxValue) * 240
              const movesHeight = (data.moves / maxValue) * 240

              return (
                <div key={data.month} className="flex flex-col items-center gap-2 flex-1">
                  <div className="flex items-end gap-1 h-60">
                    {/* Inquiries bar */}
                    <div
                      className="bg-blue-500 rounded-t-sm min-w-[8px] transition-all duration-500 ease-out"
                      style={{ height: `${inquiriesHeight}px` }}
                      title={`Inquiries: ${data.inquiries}`}
                    />
                    {/* Notices bar */}
                    <div
                      className="bg-green-500 rounded-t-sm min-w-[8px] transition-all duration-500 ease-out"
                      style={{ height: `${noticesHeight}px` }}
                      title={`Notices: ${data.notices}`}
                    />
                    {/* Moves bar */}
                    <div
                      className="bg-orange-500 rounded-t-sm min-w-[8px] transition-all duration-500 ease-out"
                      style={{ height: `${movesHeight}px` }}
                      title={`Moves: ${data.moves}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{data.month}</span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-500 rounded"></div>
              <span>Inquiries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded"></div>
              <span>Notices</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-orange-500 rounded"></div>
              <span>Moves</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
