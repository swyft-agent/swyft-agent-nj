"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

const responseTimeData = [
  { type: "Maintenance", time: 1.2, target: 2.0, status: "excellent" },
  { type: "Lease Inquiries", time: 2.8, target: 3.0, status: "good" },
  { type: "Payment Issues", time: 0.8, target: 1.0, status: "excellent" },
  { type: "Amenities", time: 4.2, target: 3.0, status: "needs-improvement" },
  { type: "General", time: 3.1, target: 3.0, status: "good" },
]

export function ResponseTimeChart() {
  const maxTime = Math.max(...responseTimeData.map((d) => Math.max(d.time, d.target))) + 1

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Response Time Analytics</CardTitle>
        <CardDescription>Average response times by inquiry type vs targets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {responseTimeData.map((item, index) => {
            const actualWidth = (item.time / maxTime) * 100
            const targetWidth = (item.target / maxTime) * 100

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.time}h</span>
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.status === "excellent"
                          ? "bg-green-500"
                          : item.status === "good"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                  </div>
                </div>
                <div className="relative h-6 bg-muted/20 rounded-full overflow-hidden">
                  {/* Target line */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gray-400 z-10"
                    style={{ left: `${targetWidth}%` }}
                    title={`Target: ${item.target}h`}
                  />
                  {/* Actual time bar */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.status === "excellent"
                        ? "bg-green-500"
                        : item.status === "good"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${actualWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0h</span>
                  <span>Target: {item.target}h</span>
                  <span>{maxTime.toFixed(1)}h</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
