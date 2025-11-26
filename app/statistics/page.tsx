"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CalendarDays, History as HistoryIcon, Loader2 } from "lucide-react"

interface HistoryMatch {
  id: number
  timestamp: string
  league: string
  homeTeam: string
  homeShortName?: string | null
  homeLogo?: string | null
  awayTeam: string
  awayShortName?: string | null
  awayLogo?: string | null
  prediction: {
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

interface HistoryDay {
  date: string
  matches: HistoryMatch[]
}

export default function RecentPredictionsPage() {
  const [days, setDays] = useState<HistoryDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/predictions/history")
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors du chargement des pronostics précédents")
      }
      const data = await response.json()
      setDays(data.days || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const hasData = days.some((day) => day.matches.length > 0)

  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pronostics récents</h1>
              <p className="text-muted-foreground">
                Les prédictions des 3 derniers jours s'affichent ici dès que la journée est terminée.
              </p>
            </div>
            <Button variant="outline" onClick={fetchHistory} className="w-full sm:w-auto">
              Rafraîchir
            </Button>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-4 flex gap-3 text-sm text-muted-foreground">
            <HistoryIcon className="h-5 w-5 text-primary" />
            <p>
              Chaque nuit, nous archivons automatiquement les pronostics validés pour conserver une trace de l'analyse IA.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Chargement des pronostics archivés...
              </div>
            </div>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <CardTitle>Impossible de charger les pronostics</CardTitle>
                </div>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={fetchHistory}>Réessayer</Button>
              </CardContent>
            </Card>
          ) : !hasData ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <CardTitle>Aucun historique disponible</CardTitle>
                <CardDescription>
                  Les pronostics apparaîtront ici dès que la journée actuelle sera archivée.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              {days.map((day) => (
                <Card key={day.date} className="border-primary/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{formatDate(day.date)}</CardTitle>
                        <CardDescription>
                          {day.matches.length} pronostic{day.matches.length > 1 ? "s" : ""} enregistrés
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                        Journée archivée
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {day.matches.map((match) => (
                      <div
                        key={match.id}
                        className="rounded-2xl border bg-card/80 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {renderTeam(
                            match.homeShortName || match.homeTeam,
                            match.homeTeam,
                            match.homeLogo
                          )}
                          <div className="text-center text-sm font-semibold text-muted-foreground">
                            vs
                          </div>
                          {renderTeam(
                            match.awayShortName || match.awayTeam,
                            match.awayTeam,
                            match.awayLogo,
                            true
                          )}
                        </div>
                        <div className="space-y-2 text-sm flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{match.league}</Badge>
                            <span className="text-muted-foreground">
                              {new Date(match.timestamp).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {match.prediction ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="rounded-xl border bg-background/80 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                  Prédiction 1N2
                                </p>
                                <p className="text-lg font-semibold">
                                  {match.prediction.prediction_1n2} · {match.prediction.confidence_1n2}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Score exact {match.prediction.predicted_score} ({match.prediction.confidence_score}%)
                                </p>
                              </div>
                              <div className="rounded-xl border bg-background/80 p-3 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">BTTS</p>
                                  <p className="font-semibold">
                                    {match.prediction.btts ? "OUI" : "NON"} · {match.prediction.confidence_btts}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">O/U 2.5</p>
                                  <p className="font-semibold">
                                    {match.prediction.over_under_2_5} · {match.prediction.confidence_ou25}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Aucune prédiction archivée pour ce match.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

function renderTeam(
  displayName: string,
  fullName: string,
  logo?: string | null,
  alignRight = false
) {
  return (
    <div className={`flex items-center gap-3 ${alignRight ? "flex-row-reverse text-right" : ""}`}>
      <div className="relative h-12 w-12 rounded-full border bg-background overflow-hidden flex items-center justify-center">
        {logo ? (
          <Image src={logo} alt={fullName} fill sizes="48px" className="object-contain p-2" />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">
            {getInitials(fullName)}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold truncate max-w-[120px]" title={fullName}>
          {displayName}
        </p>
      </div>
    </div>
  )
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

