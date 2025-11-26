import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { 
  Brain, 
  BarChart3, 
  Zap, 
  Target, 
  Activity, 
  Sparkles,
  TrendingUp,
  Shield,
  Globe,
  Clock,
  CheckCircle2
} from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      {/* Hero */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Fonctionnalités Complètes
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Tout ce dont vous avez besoin pour réussir
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Une plateforme complète avec les outils les plus avancés pour analyser et prédire les matchs de football.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {mainFeatures.map((feature, idx) => (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                      {feature.bullets && (
                        <ul className="mt-4 space-y-2">
                          {feature.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Et bien plus encore
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Des fonctionnalités conçues pour vous faire gagner du temps et améliorer vos résultats.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors">
                <feature.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Prêt à commencer ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Rejoignez-nous dès aujourd'hui et découvrez la puissance de notre plateforme.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Essai Gratuit</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">Voir les Tarifs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const mainFeatures = [
  {
    title: "IA Avancée pour l'Analyse",
    description: "Notre modèle d'IA analyse des milliers de données pour générer des prédictions précises et contextuelles.",
    icon: Brain,
    bullets: [
      "Analyse de plus de 50 métriques par match",
      "Détection des signaux faibles et surprises",
      "Cohérence automatique entre prédictions",
      "Apprentissage continu pour améliorer la précision"
    ]
  },
  {
    title: "Statistiques Complètes",
    description: "Accédez à des statistiques approfondies sur les équipes, les joueurs et les matchs historiques.",
    icon: BarChart3,
    bullets: [
      "Statistiques des 20 derniers matchs",
      "Performance domicile vs extérieur",
      "Forme récente et tendances",
      "Efficacités offensive et défensive"
    ]
  },
  {
    title: "Prédictions Multiples",
    description: "Obtenez des prédictions pour tous les types de paris : 1N2, score exact, BTTS, Over/Under et bien plus.",
    icon: Target,
    bullets: [
      "Prédiction 1N2 avec niveau de confiance",
      "Score exact prédit",
      "Both Teams To Score (BTTS)",
      "Over/Under 2.5 buts"
    ]
  },
  {
    title: "Données Enrichies",
    description: "Blessures, compositions probables, météo, et bien d'autres facteurs pris en compte dans nos analyses.",
    icon: Sparkles,
    bullets: [
      "Liste des blessures et suspensions",
      "Compositions probables avant match",
      "Conditions météorologiques",
      "Historique des confrontations directes"
    ]
  },
  {
    title: "Temps Réel",
    description: "Suivez les matchs en direct avec des analyses et prédictions mises à jour en temps réel.",
    icon: Activity,
    bullets: [
      "Mises à jour automatiques",
      "Notifications en temps réel",
      "Suivi des matchs en cours",
      "Analyses post-match"
    ]
  },
  {
    title: "Interface Moderne",
    description: "Une interface intuitive et moderne conçue pour une expérience utilisateur optimale.",
    icon: Zap,
    bullets: [
      "Design responsive (mobile, tablette, desktop)",
      "Mode sombre/clair",
      "Navigation intuitive",
      "Graphiques et visualisations interactives"
    ]
  },
]

const additionalFeatures = [
  {
    title: "Multi-Ligues",
    description: "Suivez les principales ligues européennes et internationales",
    icon: Globe,
  },
  {
    title: "Historique Complet",
    description: "Accédez à l'historique de toutes vos prédictions et analyses",
    icon: Clock,
  },
  {
    title: "Export des Données",
    description: "Exportez vos prédictions et statistiques au format CSV/JSON",
    icon: TrendingUp,
  },
  {
    title: "API Access",
    description: "Intégrez nos prédictions dans vos propres applications",
    icon: Zap,
  },
  {
    title: "Sécurité Avancée",
    description: "Vos données sont protégées avec un chiffrement de niveau entreprise",
    icon: Shield,
  },
  {
    title: "Support 24/7",
    description: "Notre équipe est là pour vous aider à tout moment",
    icon: CheckCircle2,
  },
]

