"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, Crown } from "lucide-react"
import Link from "next/link"

export function SubscriptionBanner() {
  const { user } = useAuth()

  if (!user) return null

  // Show trial banner
  if (user.plan === "trial" && user.daysRemaining !== undefined) {
    return (
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Essai gratuit actif</p>
              <p className="text-sm text-muted-foreground">
                {user.daysRemaining} jour{user.daysRemaining > 1 ? "s" : ""} restant{user.daysRemaining > 1 ? "s" : ""} sur votre essai gratuit
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/pricing">Mettre à niveau</Link>
          </Button>
        </div>
      </Card>
    )
  }

  // Show expired trial / free plan banner
  if (user.plan === "free" || (user.plan === "trial" && user.daysRemaining === 0)) {
    return (
      <Card className="mb-6 border-destructive/20 bg-destructive/5">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Plan gratuit</p>
              <p className="text-sm text-muted-foreground">
                Accédez à toutes les fonctionnalités avec un abonnement Pro
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/pricing">Voir les plans</Link>
          </Button>
        </div>
      </Card>
    )
  }

  // Show active subscription
  if (user.plan === "pro" || user.plan === "pro_max" || user.plan === "enterprise") {
    return (
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">
                {user.plan === "pro"
                  ? "Plan Pro actif"
                  : "Plan Pro Max actif"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user.plan === "pro"
                  ? "Prédictions 1N2 & Double Chance débloquées"
                  : "Accès complet (Score exact, BTTS, Over/Under)"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return null
}

