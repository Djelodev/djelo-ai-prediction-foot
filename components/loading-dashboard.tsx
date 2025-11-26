"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export function LoadingDashboard() {
  return (
    <div className="w-full space-y-6 p-4 md:p-8 min-h-screen">
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded-lg w-1/3 animate-pulse" />
        <div className="h-6 bg-muted rounded-lg w-1/2 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-12 bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 h-96 bg-muted rounded-lg" />
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    </div>
  )
}
