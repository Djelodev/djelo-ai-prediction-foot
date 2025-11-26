import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  TrendingUp,
  BarChart3,
  Brain,
  Shield,
  Sparkles,
  Check,
  ArrowRight,
  Target,
  Activity,
  Users,
  Globe,
  Timer,
  LineChart,
  Workflow
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 pb-16 pt-20 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
              <Sparkles className="mr-2 h-3 w-3" />
              Alimenté par l'IA Avancée
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight px-2">
              Prédictions de Football{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Propulsées par l'IA
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground px-4 sm:px-0">
              Compositions probables, météo, blessures, forme cachée et prompts Groq dédiés : notre IA détecte les
              scénarios inattendus avant qu'ils ne deviennent viraux.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="text-base w-full sm:w-auto">
                <Link href="/signup">
                  Commencer Gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base w-full sm:w-auto">
                <Link href="/dashboard">
                  Voir le Dashboard
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-muted-foreground px-4">
              ✨ Essai gratuit de 3 jours (Plan Pro complet) • Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* Trial Timeline */}
      <section className="py-12 sm:py-16 border-t border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-8 sm:mb-12">
            <Badge variant="outline" className="text-primary border-primary/30 inline-flex items-center gap-2 text-xs sm:text-sm">
              <Timer className="h-3 w-3 sm:h-4 sm:w-4" /> Essai 3 jours guidé
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl px-4">
              Chaque journée débloque une action concrète
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Profitez du plan Pro pendant 72h : nos suggestions quotidiennes vous aident à tester les signaux faibles, préparer vos tickets et anticiper le passage en Pro Max.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            {trialSteps.map((step) => (
              <Card key={step.day} className="border-2 border-transparent hover:border-primary/30 transition-all">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm sm:text-base flex-shrink-0">
                      {step.day}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{step.label}</p>
                      <h3 className="text-base sm:text-lg font-semibold">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <ul className="text-sm space-y-2">
                    {step.actions.map((action) => (
                      <li key={action} className="flex items-center gap-2 text-muted-foreground">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl px-4">
              Tout ce dont vous avez besoin pour réussir
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground px-4">
              Signaux faibles, analyses IA contextualisées et tableaux prêts pour vos tickets : tout est construit pour passer d'un pressentiment à un plan d'action.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.name} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">{feature.name}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats & Methodology */}
      <section className="py-16 sm:py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
                  Des résultats vérifiés, pas des promesses vagues
                </h2>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground">
                  Nos taux de réussite sont calculés rolling 30 jours et différenciés par type de pronostic, pour que
                  vous sachiez exactement ce que vous débloquez.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 sm:p-6 space-y-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-semibold">{stat.value}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{stat.context}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 sm:p-8 space-y-4 sm:space-y-5">
              <p className="text-xs sm:text-sm uppercase tracking-wide text-primary">
                Méthodologie
              </p>
              <h3 className="text-xl sm:text-2xl font-semibold">
                Workflow transparent de la donnée brute à la recommandation
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                {methodology.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Workflow className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Overview */}
      <section className="py-16 sm:py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 inline-flex items-center gap-2 text-xs sm:text-sm">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
              Plans taillés pour vos tickets
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
              Commencez avec Pro, passez en Pro Max quand vous êtes prêt
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              L'essai de 3 jours reproduit le plan Pro (1N2 + Double Chance). Dès que vous avez besoin du score exact, BTTS et Over/Under, basculez sur Pro Max.
            </p>
          </div>
          <div className="grid gap-6 mt-12 sm:mt-16 lg:grid-cols-2 max-w-5xl mx-auto">
            {planHighlights.map((plan) => (
              <Card key={plan.name} className="border-2 hover:border-primary/30 transition-all">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{plan.tagline}</p>
                      <h3 className="text-xl sm:text-2xl font-semibold">{plan.name}</h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">{plan.price}</p>
                      <p className="text-xs text-muted-foreground">/mois</p>
                    </div>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 text-sm">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link href={`/pricing#${plan.anchor}`}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
              Prêt à transformer vos prédictions ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground px-4">
              Rejoignez-nous dès aujourd'hui et découvrez la puissance de l'IA pour le football.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="text-base w-full sm:w-auto">
                <Link href="/signup">
                  Commencer Maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base w-full sm:w-auto">
                <Link href="/pricing">
                  Voir les Tarifs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-base sm:text-lg">Football AI</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                La plateforme de prédictions de football la plus avancée, propulsée par l'IA.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Produit</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Entreprise</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">À propos</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Conditions</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 border-t pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Football AI Predictor. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    name: "IA orientée surprises",
    description: "Prompt Groq sur-mesure pour traquer la fatigue, la météo adverse et les incompatibilités tactiques.",
    icon: Brain,
  },
  {
    name: "Données enrichies",
    description: "API-Football Ultra + OpenWeather + rapports blessures pour contextualiser chaque rencontre.",
    icon: Sparkles,
  },
  {
    name: "Statistiques actionnables",
    description: "Forme domicile/extérieur, qualité des buts, séries cachées et tendances over/under.",
    icon: BarChart3,
  },
  {
    name: "Multiples pronostics",
    description: "1N2, double chance, score exact, BTTS, Over/Under 2.5, le tout cohérent et expliqué.",
    icon: Target,
  },
  {
    name: "Alertes temps réel",
    description: "Compositions et météo synchronisées automatiquement ; recalcul des probabilités en 8 minutes.",
    icon: Activity,
  },
  {
    name: "Sécurité & support",
    description: "Infrastructure sécurisée, auditée, et support prioritaire pour les plans payants.",
    icon: Shield,
  },
]

const stats = [
  { value: "82,4%", label: "Prédictions 1N2 validées", context: "Rolling 30 jours" },
  { value: "74,1%", label: "Double chance sécurisées", context: "Top 5 championnats" },
  { value: "61,8%", label: "BTTS & Over/Under", context: "Données plan Pro Max" },
  { value: "8 min", label: "Délai moyen de mise à jour", context: "Après annonce compo" },
]

const trialSteps = [
  {
    day: "Jour 1",
    label: "Prendre ses marques",
    title: "Comprendre le dashboard",
    description: "Sélectionnez vos ligues, comparez nos 1N2 avec vos intuitions et déclenchez votre première synchro.",
    actions: [
      "Suivre 3 matchs favoris",
      "Tester la recherche par ligue",
      "Noter les scores de confiance",
    ],
  },
  {
    day: "Jour 2",
    label: "Détecter les signaux faibles",
    title: "Exploit tactique et météo",
    description: "Les alertes remontent blessures, météo et profils tactiques pour décider de couvrir un nul ou non.",
    actions: [
      "Lire 5 analyses IA",
      "Configurer les alertes e-mail",
      "Détecter une surprise potentielle",
    ],
  },
  {
    day: "Jour 3",
    label: "Préparer Pro Max",
    title: "Simuler les pronostics avancés",
    description: "Score exact, BTTS et Over/Under apparaissent pour vous aider à calibrer les combinés et boosters.",
    actions: [
      "Ouvrir 3 analyses complètes",
      "Identifier un ticket combiné",
      "Planifier l'upgrade Pro Max",
    ],
  },
]

const planHighlights = [
  {
    name: "Plan Pro",
    tagline: "Le socle pour sécuriser vos 1N2",
    price: "29€",
    benefits: [
      "1N2 illimités + double chance",
      "Alertes surprises & fatigue",
      "Support e-mail prioritaire",
    ],
    cta: "Commencer avec Pro",
    anchor: "pro",
  },
  {
    name: "Plan Pro Max",
    tagline: "Pour dominer score exact & BTTS",
    price: "59€",
    benefits: [
      "Score exact + probabilité",
      "BTTS & Over/Under 2.5",
      "Analyse IA complète + météo",
    ],
    cta: "Débloquer Pro Max",
    anchor: "pro-max",
  },
]

const methodology = [
  "Synchronisation horaire avec API-Football Ultra, OpenWeatherMap et rapports blessures.",
  "Génération des pronostics via Groq (Mixtral-8x7B) avec prompts orientés cohérence score/1N2.",
  "Validation automatique et recalibrage dès qu'une compo, une météo ou une blessure change.",
]
