"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Brain, Calendar, Clock, Lock, Target } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MatchData {
  id: number
  homeTeam: string
  homeShortName?: string | null
  homeLogo?: string | null
  awayTeam: string
  awayShortName?: string | null
  awayLogo?: string | null
  league: string
  date: string
  hour: string
  homeForm: string
  awayForm: string
  homeStats: {
    goalsFor: number
    goalsAgainst: number
    wins: number
    draws: number
    losses: number
  }
  awayStats: {
    goalsFor: number
    goalsAgainst: number
    wins: number
    draws: number
    losses: number
  }
  prediction?: {
    prediction_1n2: string
    confidence_1n2: number
    predicted_score: string
    confidence_score: number
    btts: boolean
    confidence_btts: number
    over_under_2_5: string
    confidence_ou25: number
    analysis: string
  } | null
}

interface Props {
  match: MatchData
}

const defaultPrediction = {
  prediction_1n2: "X" as const,
  confidence_1n2: 50,
  predicted_score: "1-1",
  confidence_score: 40,
  btts: true,
  confidence_btts: 50,
  over_under_2_5: "OVER" as const,
  confidence_ou25: 50,
  analysis: "Analyse en cours de génération...",
}

export function MatchCard({ match }: Props) {
  const [pred, setPred] = useState(match.prediction || defaultPrediction)
  const [loadingPrediction, setLoadingPrediction] = useState(!match.prediction)
  const [hasRequested, setHasRequested] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const { user } = useAuth()
  const userPlan = user?.plan === "enterprise" ? "pro_max" : (user?.plan || "free")
  const hasBasicAccess = ["trial", "pro", "pro_max"].includes(userPlan)
  const hasAdvancedAccess = userPlan === "pro_max"

  useEffect(() => {
    if (match.prediction) {
      setPred(match.prediction)
      setLoadingPrediction(false)
      return
    }

    if (!match.prediction && !hasRequested) {
      setHasRequested(true)
      setLoadingPrediction(true)
      
      fetch(`/api/predictions?matchId=${match.id}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`)
          return res.json()
        })
        .then((data) => {
          if (data.prediction) {
            setPred(data.prediction)
            setLoadingPrediction(false)
          } else {
            setLoadingPrediction(false)
          }
        })
        .catch((error) => {
          console.error(`Erreur:`, error)
          setLoadingPrediction(false)
        })
    }
  }, [match.id, match.prediction, hasRequested])

  const getConfidenceColor = (value: number) => {
    if (value >= 75) return "text-green-600 dark:text-green-400"
    if (value >= 60) return "text-blue-600 dark:text-blue-400"
    if (value >= 50) return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  const get1N2Label = (pred: string) => {
    if (pred === "1") return "Victoire Domicile"
    if (pred === "X") return "Match Nul"
    if (pred === "2") return "Victoire Extérieur"
    if (pred === "1X") return "Double Chance 1X"
    if (pred === "X2") return "Double Chance X2"
    if (pred === "12") return "Double Chance 12"
    return "Match Nul"
  }

  const matchDate = new Date(match.date)
  const dateStr = matchDate.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  if (!hasBasicAccess) {
    return (
      <Card className="relative overflow-hidden border bg-card">
        <CardContent className="p-8 text-center space-y-3">
          <Lock className="h-10 w-10 mx-auto text-primary" />
          <h3 className="text-xl font-semibold">Pronostics verrouillés</h3>
          <p className="text-sm text-muted-foreground">
            Votre essai gratuit est terminé. Passez au plan Pro pour continuer d'accéder aux pronostics 1N2 et Double Chance.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/pricing">Passer au plan Pro</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden border border-primary/5 bg-gradient-to-br from-background via-background to-primary/5 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              {match.league}
            </Badge>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{dateStr}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{match.hour}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            Pré-match
          </Badge>
        </div>

        {/* Teams */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2 md:gap-6">
            <div className="flex-1 flex justify-center md:justify-start">
              {renderTeam(
                match.homeShortName || match.homeTeam,
                match.homeTeam,
                match.homeLogo,
                match.homeForm,
                false
              )}
            </div>
            <div className="flex items-center justify-center text-muted-foreground text-xs md:text-sm font-semibold flex-shrink-0">
              <span className="px-3 py-1 md:px-6 md:py-2 rounded-full border bg-card">VS</span>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              {renderTeam(
                match.awayShortName || match.awayTeam,
                match.awayTeam,
                match.awayLogo,
                match.awayForm,
                true
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">{match.homeTeam}</p>
            <p className="text-sm font-bold">
              {match.homeStats.wins}W - {match.homeStats.draws}D - {match.homeStats.losses}L
            </p>
            <p className="text-xs text-muted-foreground">
              {match.homeStats.goalsFor}GF / {match.homeStats.goalsAgainst}GA
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold text-muted-foreground">{match.awayTeam}</p>
            <p className="text-sm font-bold">
              {match.awayStats.wins}W - {match.awayStats.draws}D - {match.awayStats.losses}L
            </p>
            <p className="text-xs text-muted-foreground">
              {match.awayStats.goalsFor}GF / {match.awayStats.goalsAgainst}GA
            </p>
          </div>
        </div>

        {/* Main Prediction */}
        {!loadingPrediction && (
          <div className="space-y-4 pt-4 border-t">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    {pred.prediction_1n2.length > 1 ? "Double Chance" : "Prédiction 1N2"}
                  </span>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">
                  {get1N2Label(pred.prediction_1n2)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confiance</span>
                  <span className={`font-bold ${getConfidenceColor(pred.confidence_1n2)}`}>
                    {pred.confidence_1n2}%
                  </span>
                </div>
                <Progress value={pred.confidence_1n2} />
                {pred.prediction_1n2.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {pred.prediction_1n2 === "1X" && "Victoire domicile ou match nul"}
                    {pred.prediction_1n2 === "X2" && "Match nul ou victoire extérieure"}
                    {pred.prediction_1n2 === "12" && "Victoire domicile ou extérieure (pas de nul)"}
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Predictions */}
            {hasAdvancedAccess ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-muted/50 border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Score</p>
                    <p className="text-lg font-bold text-primary">{pred.predicted_score}</p>
                    <p className={`text-xs ${getConfidenceColor(pred.confidence_score)}`}>
                      {pred.confidence_score}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border text-center">
                    <p className="text-xs text-muted-foreground mb-1">BTTS</p>
                    <Badge variant={pred.btts ? "default" : "secondary"} className="text-xs">
                      {pred.btts ? "OUI" : "NON"}
                    </Badge>
                    <p className={`text-xs mt-1 ${getConfidenceColor(pred.confidence_btts)}`}>
                      {pred.confidence_btts}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border text-center">
                    <p className="text-xs text-muted-foreground mb-1">O/U</p>
                    <Badge variant="outline" className="text-xs font-bold">
                      {pred.over_under_2_5}
                    </Badge>
                    <p className={`text-xs mt-1 ${getConfidenceColor(pred.confidence_ou25)}`}>
                      {pred.confidence_ou25}%
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Analyse IA
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                    {pred.analysis}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3"
                    onClick={() => setAnalysisOpen(true)}
                  >
                    Lire l'analyse complète
                  </Button>
                </div>
                <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        Analyse détaillée – {match.homeTeam} vs {match.awayTeam}
                      </DialogTitle>
                      <DialogDescription>
                        Projection IA basée sur les dynamiques avancées de forme, météo et blessures.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                        <Badge variant="outline">{match.league}</Badge>
                        <span>
                          {new Date(match.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}{" "}
                          • {match.hour}
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4 bg-muted/40 rounded-xl p-4">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground mb-1">1N2</p>
                          <p className="text-lg font-semibold">{get1N2Label(pred.prediction_1n2)}</p>
                          <p className="text-xs text-muted-foreground">{pred.confidence_1n2}% confiance</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground mb-1">Score exact</p>
                          <p className="text-lg font-semibold">{pred.predicted_score}</p>
                          <p className="text-xs text-muted-foreground">{pred.confidence_score}%</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground mb-1">BTTS & O/U</p>
                          <p className="text-sm font-medium">
                            BTTS {pred.btts ? "OUI" : "NON"} · {pred.over_under_2_5}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pred.confidence_btts}% · {pred.confidence_ou25}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Narratif IA</p>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {pred.analysis}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-muted/40 border border-dashed text-center space-y-3">
                <div className="flex items-center gap-2 justify-center text-sm font-semibold">
                  <Lock className="h-4 w-4 text-primary" />
                  Pronostics avancés verrouillés
                </div>
                <p className="text-xs text-muted-foreground">
                  Passez au plan Pro Max pour débloquer le score exact, BTTS, Over/Under et l'analyse IA complète.
                </p>
                <Button size="sm" className="w-full sm:w-auto" asChild>
                  <Link href="/pricing">Passer en Pro Max</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {loadingPrediction && (
          <div className="pt-4 border-t space-y-3">
            <div className="h-3 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
            <div className="h-3 bg-muted rounded animate-pulse w-4/6" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function renderTeam(
  displayName: string,
  fullName: string,
  logo?: string | null,
  form?: string,
  alignRight = false
) {
  return (
    <div
      className={`flex flex-col md:flex-row items-center gap-3 ${alignRight ? "md:flex-row-reverse md:text-right" : "text-center md:text-left"}`}
    >
      <div className="relative h-14 w-14 rounded-2xl bg-background border flex items-center justify-center overflow-hidden flex-shrink-0">
        {logo ? (
          <Image src={logo} alt={fullName} fill sizes="56px" className="object-contain p-2" />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">{getInitials(fullName)}</span>
        )}
      </div>
      <div className="space-y-1 min-w-0">
        <h3 className="text-base font-semibold text-foreground truncate" title={fullName}>
          {displayName}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {form || "Forme inconnue"}
        </p>
      </div>
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}
