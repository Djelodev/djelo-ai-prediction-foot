"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PredictionsDashboard } from "@/components/predictions-dashboard"
import { LoadingDashboard } from "@/components/loading-dashboard"
import { AuthGuard } from "@/components/auth-guard"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

function DashboardContent() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get("subscribed") === "true") {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        // Remove query param from URL
        window.history.replaceState({}, "", "/dashboard")
      }, 5000)
    }
  }, [searchParams])

  return (
    <>
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Abonnement activé !
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Votre plan a été activé avec succès
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
      <PredictionsDashboard />
    </>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <Suspense fallback={<LoadingDashboard />}>
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  )
}

