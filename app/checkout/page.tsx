"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { CreditCard, Lock, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const planDetails: Record<"pro" | "pro_max", { name: string; price: number; duration: string; summary: string; includes: string[] }> = {
  pro: { 
    name: "Plan Pro", 
    price: 29, 
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
    price: 59, 
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
  const { user, refetch, loading: authLoading } = useAuth()
  const planParam = searchParams.get("plan") || "pro"
  const normalizedPlan: "pro" | "pro_max" = planParam === "pro_max" || planParam === "pro"
    ? (planParam as "pro" | "pro_max")
    : planParam === "enterprise"
      ? "pro_max"
      : "pro"
  const planInfo = planDetails[normalizedPlan]

  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    console.log("💳 Processing payment for plan:", normalizedPlan)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      const response = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: normalizedPlan,
          durationMonths: 1,
          // In a real app, you would send payment info to a payment processor
          paymentMethod: "card",
        }),
      })

      const data = await response.json()
      console.log("💳 Subscription response:", data)

      if (response.ok) {
        console.log("✅ Subscription activated, refreshing session...")
        // Refresh session to get updated subscription status
        await refetch()
        console.log("✅ Session refreshed, redirecting...")
        // Use window.location.href to force a full page reload
        window.location.href = "/dashboard?subscribed=true"
      } else {
        console.error("❌ Subscription error:", data)
        alert(data.error || "Erreur lors de l'activation de l'abonnement")
        setLoading(false)
      }
    } catch (error) {
      console.error("❌ Subscription catch error:", error)
      alert("Erreur lors de l'activation de l'abonnement")
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
            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informations de paiement
                </CardTitle>
                <CardDescription>
                  Paiement sécurisé (simulation)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Numéro de carte</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, "").slice(0, 16))}
                      maxLength={16}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-name">Nom sur la carte</Label>
                    <Input
                      id="card-name"
                      placeholder="Jean Dupont"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-expiry">Date d'expiration</Label>
                      <Input
                        id="card-expiry"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "")
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + "/" + value.slice(2, 4)
                          }
                          setCardExpiry(value)
                        }}
                        maxLength={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card-cvv">CVV</Label>
                      <Input
                        id="card-cvv"
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <Lock className="h-4 w-4" />
                    <span>Paiement sécurisé et crypté</span>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      `Payer ${planInfo.price}€`
                    )}
                  </Button>
                </form>
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
                      <span>{planInfo.price}€</span>
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

