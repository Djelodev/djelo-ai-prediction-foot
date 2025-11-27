"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { CreditCard, Lock, Check, Loader2, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const planDetails: Record<"pro" | "pro_max", { name: string; price: number; duration: string; summary: string; includes: string[] }> = {
  pro: { 
    name: "Plan Pro", 
    price: 19, 
    duration: "1 mois",
    summary: "Débloque les pronostics 1N2 et Double Chance sans limite.",
    includes: [
      "Prédictions 1N2 illimitées",
      "Double chance sur tous les matchs",
      "Accès aux alertes de surprises"
    ],
  },
  pro_max: { 
    name: "Plan Pro Max", 
    price: 29, 
    duration: "1 mois",
    summary: "Ajoute les pronostics avancés (Score exact, BTTS, Over/Under).",
    includes: [
      "Tout le plan Pro",
      "Score exact avec niveau de confiance",
      "BTTS & Over/Under 2.5",
    ],
  },
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const planParam = searchParams.get("plan") || "pro"
  const normalizedPlan: "pro" | "pro_max" = planParam === "pro_max" || planParam === "pro"
    ? (planParam as "pro" | "pro_max")
    : planParam === "enterprise"
      ? "pro_max"
      : "pro"
  const planInfo = planDetails[normalizedPlan]

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    console.log("🛒 Checkout page loaded:", { plan: normalizedPlan, planInfo, user: user?.id })
        
    if (!user) {
      console.log("❌ No user, redirecting to login")
      router.push("/login")
      return
    }
    
    console.log("✅ Checkout ready for plan:", normalizedPlan)
  }, [user, router, normalizedPlan, planInfo, authLoading])

  const handlePaystackCheckout = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: normalizedPlan,
        }),
      })

      const data = await response.json()
      console.log("💳 Paystack init response:", data)

      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Impossible d'initialiser le paiement.")
      }

      window.location.href = data.authorizationUrl as string
    } catch (error) {
      console.error("❌ Paystack init error:", error)
      const message =
        error instanceof Error ? error.message : "Impossible d'initialiser le paiement."
      setErrorMessage(message)
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <DashboardLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Finaliser votre abonnement</h1>
            <p className="text-muted-foreground">
              Complétez votre paiement pour activer votre {planInfo.name}. {planInfo.summary}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Payment CTA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Paiement sécurisé via Paystack
                </CardTitle>
                <CardDescription>
                  Vous serez redirigé vers Paystack pour finaliser votre {planInfo.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Paiement protégé</AlertTitle>
                  <AlertDescription>
                    Paystack chiffre vos informations bancaires et valide instantanément votre abonnement.
                  </AlertDescription>
                </Alert>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTitle>Impossible d'initialiser Paystack</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handlePaystackCheckout} className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirection vers Paystack...
                    </>
                  ) : (
                    "Procéder au paiement sécurisé"
                  )}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Montant facturé : {planInfo.price}$ / mois. Annulation possible à tout moment.</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{planInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée</span>
                    <span className="font-medium">{planInfo.duration}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{planInfo.summary}</p>
                  <ul className="space-y-2 border rounded-lg p-3 bg-muted/30">
                    {planInfo.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 mt-0.5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{planInfo.price}$</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Annulation à tout moment</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Accès immédiat après paiement</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Reçus envoyés automatiquement</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

