"use client"

import { useState, useMemo, useEffect } from "react"
import { MatchCard } from "./match-card"
import { SubscriptionBanner } from "./subscription-banner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Search, Sparkles, Calendar, Clock } from "lucide-react"
import { DashboardLayout } from "./dashboard-layout"
import { Badge } from "@/components/ui/badge"

const LEAGUES = [
  "Tous les Matchs",
  "UEFA Champions League",
  "UEFA Europa League",
  "Premier League",
  "Ligue 1",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Eredivisie",
]

const DAY_OPTIONS = [
  { label: "3 jours", value: 3 },
  { label: "7 jours", value: 7 },
  { label: "14 jours", value: 14 },
]

interface Match {
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

export function PredictionsDashboard() {
  const [selectedLeague, setSelectedLeague] = useState("Tous les Matchs")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [generatingPredictions, setGeneratingPredictions] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [daysRange, setDaysRange] = useState(7)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const loadMatches = async ({ forceSync = false, days }: { forceSync?: boolean; days?: number } = {}) => {
    try {
      setLoading(true)
      setError(null)
      const targetDays = days ?? daysRange

      // Ne synchroniser que si explicitement demandé (forceSync = true)
      if (forceSync) {
        setSyncing(true)
        const syncResponse = await fetch(`/api/sync?days=${targetDays}`)
        const syncData = await syncResponse.json()
        
        if (!syncResponse.ok) {
          throw new Error(syncData.error || "Erreur lors de la synchronisation")
        }
        setSyncing(false)
      }

      // Toujours charger depuis la base de données (pas d'appel API externe)
      const response = await fetch(`/api/matches?days=${targetDays}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erreur lors du chargement des matchs")
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setLastUpdated(data.lastUpdated || null)

      if (data.matches && data.matches.length === 0) {
        fetch("/api/debug/matches")
          .then((res) => res.json())
          .then((debugData) => {
            setError(
              `Aucun match trouvé dans la base de données.\n\n` +
              `Debug: ${debugData.debug?.totalMatches || 0} matchs totaux, ` +
              `${debugData.debug?.upcomingMatches || 0} matchs à venir, ` +
              `${debugData.debug?.scheduledMatches || 0} avec statut "scheduled".`
            )
          })
          .catch(() => {
            setError("Aucun match trouvé. Vérifiez la synchronisation.")
          })
      }

      const matchesWithoutPrediction = data.matches?.filter((m: Match) => !m.prediction) || []
      if (matchesWithoutPrediction.length > 0 && !generatingPredictions) {
        setGeneratingPredictions(true)
        fetch("/api/predictions")
          .then(() => {
            setGeneratingPredictions(false)
            setTimeout(() => {
        fetch(`/api/matches?days=${targetDays}`)
                .then((res) => res.json())
                .then((newData) => {
                  setMatches(newData.matches || [])
            setLastUpdated(newData.lastUpdated || null)
                })
                .catch(console.error)
            }, 3000)
          })
          .catch((error) => {
            console.error("Erreur:", error)
            setGeneratingPredictions(false)
          })
      }
    } catch (err) {
      console.error("Erreur:", err)
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue"
      setError(errorMessage)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadMatches({ days: daysRange })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysRange])

  const filteredMatches = useMemo(() => {
    let filtered = matches

    if (selectedLeague !== "Tous les Matchs") {
      filtered = filtered.filter((match) => match.league === selectedLeague)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (match) =>
          match.homeTeam.toLowerCase().includes(query) ||
          match.awayTeam.toLowerCase().includes(query) ||
          match.league.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [matches, selectedLeague, searchQuery])

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.hour}`)
    const dateB = new Date(`${b.date}T${b.hour}`)
    return dateA.getTime() - dateB.getTime()
  })

  const formatLastUpdated = () => {
    if (!lastUpdated) return "Jamais synchronisé"
    const date = new Date(lastUpdated)
    const diffMs = Date.now() - date.getTime()
    if (diffMs < 60000) return "Mise à jour il y a moins d'une minute"
    const minutes = Math.round(diffMs / 60000)
    if (minutes < 60) return `Mis à jour il y a ${minutes} min`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `Mis à jour il y a ${hours} h`
    const days = Math.round(hours / 24)
    return `Mis à jour il y a ${days} j`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-lg font-medium">
              {syncing ? "Synchronisation..." : "Chargement..."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-destructive mb-2">Erreur</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">{error}</p>
              <Button onClick={() => loadMatches()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="bg-gradient-to-br from-background via-background to-muted/20 min-h-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Prédictions</h1>
              <p className="text-muted-foreground">Analysez les matchs avec l'intelligence artificielle</p>
            </div>
          </div>

          {/* Subscription Banner */}
          <SubscriptionBanner />

          {/* Filters and Search */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un match ou une équipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {DAY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDaysRange(option.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      daysRange === option.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card border border-border hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => loadMatches({ forceSync: true })}
                disabled={syncing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? "Synchronisation..." : "Synchroniser"}
              </Button>
            </div>

            {/* League Filters */}
            <div className="flex flex-wrap gap-2">
              {LEAGUES.map((league) => (
                <button
                  key={league}
                  onClick={() => setSelectedLeague(league)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedLeague === league
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{sortedMatches.length}</span> match{sortedMatches.length > 1 ? "s" : ""}
                </span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatLastUpdated()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {generatingPredictions && (
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span className="font-semibold">Génération IA en cours</span>
                  </div>
                )}
                {syncing && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synchronisation programmée</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Matches Grid */}
          {sortedMatches.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {sortedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="py-16">
              <div className="max-w-3xl mx-auto border border-dashed rounded-3xl p-10 text-center bg-card/50 backdrop-blur">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-semibold">Aucun match prêt à être analysé</h3>
                  <p className="text-muted-foreground max-w-2xl">
                    Nous n'avons pas trouvé de rencontres pour les {daysRange} prochains jours avec vos filtres actuels.
                    Synchronisez les données ou élargissez la fenêtre temporelle pour remplir le dashboard.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <Button onClick={() => loadMatches({ forceSync: true })}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Relancer la synchronisation
                    </Button>
                    {selectedLeague !== "Tous les Matchs" && (
                      <Button variant="outline" onClick={() => setSelectedLeague("Tous les Matchs")}>
                        Réinitialiser les ligues
                      </Button>
                    )}
                    {daysRange < 14 && (
                      <Button variant="ghost" onClick={() => setDaysRange(14)}>
                        Étendre à 14 jours
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
