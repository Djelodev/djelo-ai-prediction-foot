"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Check, Zap, Crown, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: "19",
    period: "mois",
    description: "Pour continuer après l'essai gratuit",
    features: [
      "Prédictions 1N2 illimitées",
      "Double chance débloquée",
      "Alertes sur les surprises détectées",
      "Support par email",
    ],
    highlight: "Idéal pour valider vos tickets 1N2",
    icon: Zap,
    popular: false,
  },
  {
    id: "pro_max",
    name: "Pro Max",
    price: "29",
    period: "mois",
    description: "Pour un contrôle total de vos paris",
    features: [
      "Tout le plan Pro",
      "Score exact et probabilité détaillée",
      "BTTS avec confiance IA",
      "Over/Under 2.5 dynamique",
      "Analyse IA complète et météo match",
    ],
    highlight: "Débloque tous les pronostics avancés",
    icon: Crown,
    popular: true,
  },
]

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: "pro" | "pro_max") => {
    console.log("🛒 Subscribe clicked:", { plan, user: user?.id })
    
    if (!user) {
      console.log("❌ No user, redirecting to signup")
      router.push("/signup")
      return
    }

    console.log("✅ Redirecting to checkout:", `/checkout?plan=${plan}`)
    setLoading(plan)
    window.location.href = `/checkout?plan=${plan}`
  }

  const getCurrentPlan = () => {
    if (!user || !user.plan) return null
    const normalized = user.plan === "enterprise" ? "pro_max" : user.plan.toLowerCase()
    if (normalized === "pro" || normalized === "pro_max" || normalized === "trial") {
      return normalized
    }
    return "free"
  }

  const currentPlan = getCurrentPlan()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Tarifs simples et transparents
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            3 jours gratuits pour tester les pronostics 1N2 et Double Chance. Ensuite, choisissez le plan qui correspond à votre niveau d'analyse.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="px-4 py-2 rounded-full border border-primary/20">
              Jour 0-3 : Essai gratuit (1N2 + Double Chance)
            </span>
            <span className="px-4 py-2 rounded-full border border-primary/20">
              Dès J+4 : Abonnement mensuel, résiliable à tout moment
            </span>
          </div>
        </div>

        {/* Current Plan Banner */}
        {user && currentPlan && (
          <div className="container mx-auto px-4 mb-8">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan actuel</p>
                    <p className="text-2xl font-bold">
                      {currentPlan === "trial"
                        ? "Essai Gratuit"
                        : currentPlan === "pro"
                        ? "Plan Pro"
                        : currentPlan === "pro_max"
                        ? "Plan Pro Max"
                        : "Plan Gratuit"}
                    </p>
                    {currentPlan === "trial" && user.daysRemaining !== undefined && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.daysRemaining} jour{user.daysRemaining > 1 ? "s" : ""} restant{user.daysRemaining > 1 ? "s" : ""}
                        {" "}avant facturation
                      </p>
                    )}
                    {currentPlan === "pro" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Accès illimité aux pronostics 1N2 & Double Chance
                      </p>
                    )}
                    {currentPlan === "pro_max" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Pronostics complets (Score exact, BTTS, Over/Under)
                      </p>
                    )}
                  </div>
                  {(currentPlan === "free" || currentPlan === "trial") && (
                    <Button
                      onClick={() => handleSubscribe("pro")}
                      disabled={loading === "pro" || authLoading}
                      className="min-w-[190px]"
                    >
                      {loading === "pro" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        "Passer au plan Pro"
                      )}
                    </Button>
                  )}
                  {currentPlan === "pro" && (
                    <Button
                      variant="outline"
                      onClick={() => handleSubscribe("pro_max")}
                      disabled={loading === "pro_max" || authLoading}
                      className="min-w-[190px]"
                    >
                      {loading === "pro_max" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        "Passer en Pro Max"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon
              const planKey = plan.id as "pro" | "pro_max"
              const isCurrentPlan = currentPlan === planKey
              
              return (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""} ${
                    isCurrentPlan ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        Recommandé
                      </span>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Actuel
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-6 w-6 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <p className="text-sm text-primary mt-2">{plan.highlight}</p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}$</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(planKey)}
                      disabled={loading === planKey || isCurrentPlan || authLoading}
                    >
                      {loading === planKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirection...
                        </>
                      ) : isCurrentPlan ? (
                        "Plan actuel"
                      ) : (
                        "S'abonner"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Comparison section */}
        <div className="container mx-auto px-4 pb-16">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Comparer les accès</CardTitle>
              <CardDescription>
                L'essai gratuit couvre le plan Pro pendant 3 jours. Passez à Pro Max pour déverrouiller les signaux avancés.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-3">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground font-medium">Fonctionnalité</th>
                    <th className="text-center text-primary font-semibold">Pro</th>
                    <th className="text-center text-primary font-semibold">Pro Max</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Pronostics 1N2 illimités", pro: true, proMax: true },
                    { feature: "Double chance", pro: true, proMax: true },
                    { feature: "Score exact + probabilité", pro: false, proMax: true },
                    { feature: "BTTS & Over/Under 2.5", pro: false, proMax: true },
                    { feature: "Analyse IA détaillée", pro: false, proMax: true },
                    { feature: "Priorité support", pro: true, proMax: true },
                  ].map((row) => (
                    <tr key={row.feature} className="bg-card/60 rounded-xl">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.feature}</td>
                      <td className="py-3 text-center">
                        {row.pro ? (
                          <Badge variant="secondary">Inclus</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {row.proMax ? (
                          <Badge>Inclus</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
