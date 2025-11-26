"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"

interface FeatureGuardProps {
  children: React.ReactNode
  requiredPlan?: "trial" | "pro" | "pro_max"
  fallback?: React.ReactNode
}

export function FeatureGuard({ 
  children, 
  requiredPlan = "pro",
  fallback 
}: FeatureGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Connexion requise</h3>
        <p className="text-muted-foreground mb-4">
          Vous devez être connecté pour accéder à cette fonctionnalité
        </p>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </Card>
    )
  }

  // Check plan access
  const planHierarchy: Record<string, number> = {
    free: 0,
    trial: 1,
    pro: 2,
    pro_max: 3,
    enterprise: 3, // legacy support
  }

  const planLabels: Record<string, string> = {
    trial: "Essai Gratuit",
    pro: "Plan Pro",
    pro_max: "Plan Pro Max",
  }

  const userPlanLevel = planHierarchy[user.plan || "free"] || 0
  const requiredPlanLevel = planHierarchy[requiredPlan] || 0

  if (userPlanLevel < requiredPlanLevel) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Card className="p-8 text-center border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Fonctionnalité Premium</h3>
        <p className="text-muted-foreground mb-4">
          Cette fonctionnalité est disponible avec le {planLabels[requiredPlan] || "plan Pro"}
        </p>
        <Button asChild>
          <Link href="/pricing">Mettre à niveau</Link>
        </Button>
      </Card>
    )
  }

  return <>{children}</>
}

