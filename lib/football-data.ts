/**
 * Service pour interagir avec Football-Data.org (gratuit)
 * Documentation: https://www.football-data.org/documentation/quickstart
 * Plan gratuit: 10 requêtes/minute, données gratuites
 * 
 * AVANTAGES:
 * - Gratuit et fonctionne pour les matchs à venir
 * - Pas besoin de clé API pour le plan gratuit (mais recommandé)
 * - Données fiables et mises à jour
 */

import { checkRateLimit, getRateLimitUsage } from "./rate-limiter"

const API_BASE_URL = "https://api.football-data.org/v4"
const API_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN || "" // Optionnel pour le plan gratuit
const FOOTBALL_DATA_MINUTE_LIMIT = 10 // Plan gratuit: 10 requêtes/minute
const FOOTBALL_DATA_MAX_COMPETITIONS = 12 // Plan gratuit: 12 compétitions max

interface FootballDataResponse<T> {
  count: number
  filters: Record<string, unknown>
  matches: T[]
}

interface FootballDataMatch {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  lastUpdated: string
  homeTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  score: {
    winner: string | null
    duration: string
    fullTime: {
      home: number | null
      away: number | null
    }
    halfTime: {
      home: number | null
      away: number | null
    }
  }
  odds: {
    msg: string
  } | null
  referees: Array<{
    id: number
    name: string
    type: string
    nationality: string
  }>
}

interface FootballDataCompetition {
  id: number
  name: string
  code: string
  type: string
  emblem: string
}

/**
 * IDs des compétitions principales (Football-Data.org)
 */
const COMPETITION_IDS = {
  PREMIER_LEAGUE: "PL", // Premier League
  LA_LIGA: "PD", // Primera División
  SERIE_A: "SA", // Serie A
  LIGUE_1: "FL1", // Ligue 1
  BUNDESLIGA: "BL1", // Bundesliga
  CHAMPIONS_LEAGUE: "CL", // Champions League
  EUROPA_LEAGUE: "EL", // Europa League
}

// Mapping des codes de compétition vers les noms
const COMPETITION_NAMES: Record<string, string> = {
  PL: "Premier League",
  PD: "La Liga",
  SA: "Serie A",
  FL1: "Ligue 1",
  BL1: "Bundesliga",
  CL: "UEFA Champions League",
  EL: "UEFA Europa League",
}

async function fetchFootballData<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  // Vérifier le rate limit par minute (10 req/min pour le plan gratuit)
  const allowed = await checkRateLimit("football-data", FOOTBALL_DATA_MINUTE_LIMIT, "minute")
  if (!allowed) {
    const usage = await getRateLimitUsage("football-data", "minute")
    throw new Error(
      `Limite Football-Data atteinte: ${usage}/${FOOTBALL_DATA_MINUTE_LIMIT} requêtes utilisées cette minute. Attendez quelques secondes.`
    )
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  // Log de l'URL (sans le token)
  const urlForLog = url.toString().replace(API_TOKEN, "***")
  console.log(`🌐 Football-Data URL: ${urlForLog}`)

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  // Ajouter le token si disponible (optionnel pour le plan gratuit)
  if (API_TOKEN) {
    headers["X-Auth-Token"] = API_TOKEN
  }

  const response = await fetch(url.toString(), { headers })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ Football-Data erreur ${response.status}:`, error)
    throw new Error(`Football-Data error: ${response.status} - ${error}`)
  }

  const data = await response.json()

  // Log de la réponse
  if ("matches" in data) {
    console.log(`📥 Football-Data: ${data.count || data.matches?.length || 0} matchs trouvés`)
  }

  return data as T
}

/**
 * Récupère les matchs à venir pour les compétitions principales
 */
export async function getUpcomingFixtures(days: number = 7): Promise<FootballDataMatch[]> {
  try {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    const fromDate = today.toISOString().split("T")[0]
    const toDate = futureDate.toISOString().split("T")[0]

    console.log(`🔍 Recherche de matchs du ${fromDate} au ${toDate}`)

    // Compétitions à récupérer
    // Plan gratuit: maximum 12 compétitions, on en utilise 4 pour rester bien en dessous
    const competitions = [
      COMPETITION_IDS.PREMIER_LEAGUE,
      COMPETITION_IDS.LA_LIGA,
      COMPETITION_IDS.SERIE_A,
      COMPETITION_IDS.LIGUE_1,
      // On peut ajouter jusqu'à 12 compétitions max (plan gratuit)
      // COMPETITION_IDS.BUNDESLIGA,
      // COMPETITION_IDS.CHAMPIONS_LEAGUE,
      // COMPETITION_IDS.EUROPA_LEAGUE,
    ]

    // Vérifier qu'on ne dépasse pas la limite de 12 compétitions
    if (competitions.length > FOOTBALL_DATA_MAX_COMPETITIONS) {
      console.warn(
        `⚠️ Attention: ${competitions.length} compétitions demandées, limite plan gratuit: ${FOOTBALL_DATA_MAX_COMPETITIONS}`
      )
      competitions.splice(FOOTBALL_DATA_MAX_COMPETITIONS)
    }

    const allMatches: FootballDataMatch[] = []

    // Ajouter un délai entre les requêtes pour respecter la limite de 10 req/min
    // 10 req/min = 1 req toutes les 6 secondes minimum
    const delayBetweenRequests = 6500 // 6.5 secondes pour être sûr

    for (let i = 0; i < competitions.length; i++) {
      const competitionCode = competitions[i]
      
      // Attendre entre les requêtes (sauf pour la première)
      if (i > 0) {
        console.log(`⏳ Attente de ${delayBetweenRequests / 1000}s pour respecter la limite de 10 req/min...`)
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests))
      }

      try {
        console.log(`📡 Appel API pour compétition ${competitionCode} (${i + 1}/${competitions.length})`)

        const data = await fetchFootballData<FootballDataResponse<FootballDataMatch>>(
          `/competitions/${competitionCode}/matches`,
          {
            dateFrom: fromDate,
            dateTo: toDate,
            status: "SCHEDULED", // Matchs programmés
          }
        )

        // Ajouter le code de compétition à chaque match
        const matchesWithCompetition = data.matches.map((match) => ({
          ...match,
          competition: {
            id: 0,
            name: COMPETITION_NAMES[competitionCode] || competitionCode,
            code: competitionCode,
          },
        }))

        if (matchesWithCompetition && matchesWithCompetition.length > 0) {
          console.log(`✅ ${matchesWithCompetition.length} matchs trouvés pour ${competitionCode}`)
          const firstMatch = matchesWithCompetition[0]
          console.log(
            `   📍 Premier: ${firstMatch.homeTeam.name} vs ${firstMatch.awayTeam.name} le ${firstMatch.utcDate}`
          )
          allMatches.push(...matchesWithCompetition)
        } else {
          console.log(`⚠️ Aucun match trouvé pour ${competitionCode}`)
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${competitionCode}:`, error instanceof Error ? error.message : error)
        // Continuer avec les autres compétitions
      }
    }

    console.log(`📊 Total: ${allMatches.length} matchs trouvés`)

    // Trier par date
    return allMatches.sort((a, b) => {
      return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des matchs:", error)
    return []
  }
}

/**
 * Récupère les matchs passés (finis) pour calculer les statistiques des équipes
 */
export async function getPastFixtures(days: number = 30): Promise<FootballDataMatch[]> {
  try {
    const today = new Date()
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)

    const fromDate = pastDate.toISOString().split("T")[0]
    const toDate = today.toISOString().split("T")[0]

    console.log(`🔍 Recherche de matchs passés du ${fromDate} au ${toDate}`)

    const competitions = [
      COMPETITION_IDS.PREMIER_LEAGUE,
      COMPETITION_IDS.LA_LIGA,
      COMPETITION_IDS.SERIE_A,
      COMPETITION_IDS.LIGUE_1,
    ]

    const allMatches: FootballDataMatch[] = []
    const delayBetweenRequests = 6500

    for (let i = 0; i < competitions.length; i++) {
      const competitionCode = competitions[i]
      
      if (i > 0) {
        console.log(`⏳ Attente de ${delayBetweenRequests / 1000}s...`)
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests))
      }

      try {
        console.log(`📡 Récupération matchs passés pour ${competitionCode} (${i + 1}/${competitions.length})`)

        const data = await fetchFootballData<FootballDataResponse<FootballDataMatch>>(
          `/competitions/${competitionCode}/matches`,
          {
            dateFrom: fromDate,
            dateTo: toDate,
            status: "FINISHED", // Matchs terminés
          }
        )

        const matchesWithCompetition = data.matches.map((match) => ({
          ...match,
          competition: {
            id: 0,
            name: COMPETITION_NAMES[competitionCode] || competitionCode,
            code: competitionCode,
          },
        }))

        if (matchesWithCompetition && matchesWithCompetition.length > 0) {
          console.log(`✅ ${matchesWithCompetition.length} matchs passés trouvés pour ${competitionCode}`)
          allMatches.push(...matchesWithCompetition)
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${competitionCode}:`, error instanceof Error ? error.message : error)
      }
    }

    console.log(`📊 Total: ${allMatches.length} matchs passés trouvés`)
    return allMatches.sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des matchs passés:", error)
    return []
  }
}

/**
 * Récupère les informations d'une compétition
 */
export async function getCompetitionInfo(competitionCode: string): Promise<FootballDataCompetition | null> {
  try {
    const data = await fetchFootballData<FootballDataCompetition>(`/competitions/${competitionCode}`)
    return data
  } catch (error) {
    console.error(`Erreur lors de la récupération de la compétition ${competitionCode}:`, error)
    return null
  }
}

/**
 * Convertit un match Football-Data en format compatible avec notre système
 */
export function convertFootballDataMatch(match: FootballDataMatch, competitionName: string) {
  return {
    fixture: {
      id: match.id,
      date: match.utcDate,
      status: {
        short: match.status === "SCHEDULED" ? "NS" : match.status,
        long: match.status,
      },
    },
    league: {
      id: 0, // Football-Data n'utilise pas d'ID numérique pour les compétitions
      name: competitionName,
      country: "",
      season: new Date(match.utcDate).getFullYear(),
    },
    teams: {
      home: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
      },
      away: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
      },
    },
    goals: {
      home: match.score.fullTime.home,
      away: match.score.fullTime.away,
    },
  }
}

