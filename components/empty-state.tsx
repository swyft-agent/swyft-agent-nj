"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ title, description, actionLabel, actionHref, onAction, className = "" }: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
        <p className="text-xs text-muted-foreground mb-4">
          If you have data that should appear here, try refreshing the page or check your filters.
        </p>
        {actionLabel && (
          <div className="mt-2">
            {actionHref ? (
              <Button asChild>
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : onAction ? (
              <Button onClick={onAction}>{actionLabel}</Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EmptyState
