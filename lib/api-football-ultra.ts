/**
 * Service complet API-Football Plan Ultra
 * Plan Ultra: $29/mois - 75 000 requêtes/jour
 * 
 * DONNÉES DISPONIBLES:
 * ✅ Fixtures (matchs à venir et passés)
 * ✅ Injuries (blessures)
 * ✅ Lineups (compositions)
 * ✅ Statistics (statistiques détaillées)
 * ✅ Head-to-head (confrontations directes)
 * ✅ Predictions
 * ✅ Players & Coaches
 * ✅ Transfers
 * ✅ Et bien plus...
 */

import { checkRateLimit, getRateLimitUsage } from "./rate-limiter"

const API_BASE_URL = "https://v3.football.api-sports.io"
const API_KEY = process.env.API_FOOTBALL_KEY || ""
const API_FOOTBALL_DAILY_LIMIT = 75000 // Plan Ultra: 75 000 requêtes/jour

interface ApiFootballResponse<T> {
  get: string
  parameters: Record<string, unknown>
  errors: unknown[]
  results: number
  paging: {
    current: number
    total: number
  }
  response: T[]
}

interface ApiFixture {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    venue: {
      id: number | null
      name: string
      city: string
      country?: string
    }
    status: {
      long: string
      short: string
      elapsed: number | null
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
    round: string
  }
  teams: {
    home: {
      id: number
      name: string
      winner: boolean | null
    }
    away: {
      id: number
      name: string
      winner: boolean | null
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

interface ApiInjury {
  player: {
    id: number
    name: string
    photo: string
  }
  team: {
    id: number
    name: string
    logo: string
  }
  fixture: {
    id: number
  }
  type: string // "Injury" | "Suspension"
  reason: string
}

interface ApiLineup {
  team: {
    id: number
    name: string
    logo: string
  }
  coach: {
    id: number
    name: string
    photo: string
  }
  formation: string
  startXI: Array<{
    player: {
      id: number
      name: string
      number: number
      pos: string
      grid: string
    }
  }>
  substitutes: Array<{
    player: {
      id: number
      name: string
      number: number
      pos: string
      grid: string
    }
  }>
}

interface ApiStatistics {
  team: {
    id: number
    name: string
    logo: string
  }
  statistics: Array<{
    type: string
    value: number | string | null
  }>
}

interface ApiHeadToHead {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    venue: {
      id: number | null
      name: string
      city: string
    }
    status: {
      long: string
      short: string
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
  }
  teams: {
    home: {
      id: number
      name: string
      winner: boolean | null
    }
    away: {
      id: number
      name: string
      winner: boolean | null
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
  score: {
    halftime: {
      home: number | null
      away: number | null
    }
    fulltime: {
      home: number | null
      away: number | null
    }
  }
}

/**
 * Fonction générique pour appeler l'API
 */
async function fetchApiFootball<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  if (!API_KEY) {
    throw new Error("API_FOOTBALL_KEY non configurée")
  }

  // Vérifier le rate limit (mais avec 75000 req/jour, on a de la marge)
  const allowed = await checkRateLimit("api-football", API_FOOTBALL_DAILY_LIMIT)
  if (!allowed) {
    const usage = await getRateLimitUsage("api-football")
    throw new Error(`Limite API-Football atteinte: ${usage}/${API_FOOTBALL_DAILY_LIMIT} requêtes`)
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  // Support des deux méthodes d'authentification :
  // 1. Via RapidAPI (x-rapidapi-key)
  // 2. Via Dashboard API-Football (x-apisports-key)
  const headers: Record<string, string> = {
    "x-rapidapi-host": "v3.football.api-sports.io",
  }
  
  // Détection du type de clé :
  // - Si la clé contient "rapidapi" → RapidAPI
  // - Sinon → Dashboard API-Football (par défaut, plus courant)
  if (API_KEY.toLowerCase().includes("rapidapi")) {
    // Clé RapidAPI
    headers["x-rapidapi-key"] = API_KEY
  } else {
    // Clé Dashboard API-Football (méthode par défaut)
    headers["x-apisports-key"] = API_KEY
  }

  const response = await fetch(url.toString(), {
    headers,
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ API-Football erreur ${response.status}:`, error)
    throw new Error(`API-Football error: ${response.status}`)
  }

  const data: ApiFootballResponse<T> = await response.json()

  if (data.errors && data.errors.length > 0) {
    console.warn("⚠️ API-Football erreurs:", JSON.stringify(data.errors, null, 2))
  }

  return data.response || []
}

/**
 * Récupère les matchs à venir
 */
export async function getUpcomingFixtures(days: number = 7): Promise<ApiFixture[]> {
  try {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    const season = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1

    const fromDate = today.toISOString().split("T")[0]
    const toDate = futureDate.toISOString().split("T")[0]

    console.log(`🔍 Recherche de matchs du ${fromDate} au ${toDate} (saison ${season})`)

    // Ligues principales (on peut en ajouter plus avec 75000 req/jour !)
    const leagueIds = [
      "39", // Premier League
      "140", // La Liga
      "135", // Serie A
      "61", // Ligue 1
      "78", // Bundesliga
      "2", // UEFA Champions League
      "3", // UEFA Europa League
    ]

    const allFixtures: ApiFixture[] = []

    for (const leagueId of leagueIds) {
      try {
        console.log(`📡 Appel API pour ligue ${leagueId}`)
        
        const fixtures = await fetchApiFootball<ApiFixture>("/fixtures", {
          league: leagueId,
          season: season.toString(),
          from: fromDate,
          to: toDate,
          status: "NS", // Not Started
        })

        const nsFixtures = fixtures.filter(f => f.fixture.status.short === "NS")
        console.log(`✅ ${nsFixtures.length} matchs à venir trouvés pour ligue ${leagueId}`)
        
        allFixtures.push(...nsFixtures)
      } catch (error) {
        console.error(`❌ Erreur pour ligue ${leagueId}:`, error instanceof Error ? error.message : error)
      }
    }

    console.log(`📊 Total: ${allFixtures.length} matchs à venir trouvés`)
    return allFixtures.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des matchs:", error)
    return []
  }
}

/**
 * Récupère les blessures et suspensions d'une équipe
 */
export async function getTeamInjuries(teamId: number, season?: number): Promise<ApiInjury[]> {
  try {
    const params: Record<string, string> = { team: teamId.toString() }
    if (season) {
      params.season = season.toString()
    }

    const injuries = await fetchApiFootball<ApiInjury>("/injuries", params)
    console.log(`🏥 ${injuries.length} blessures/suspensions trouvées pour équipe ${teamId}`)
    return injuries
  } catch (error) {
    console.error(`❌ Erreur récupération blessures équipe ${teamId}:`, error)
    return []
  }
}

/**
 * Récupère la composition d'un match
 */
export async function getMatchLineup(fixtureId: number): Promise<{ home: ApiLineup | null; away: ApiLineup | null }> {
  try {
    const lineups = await fetchApiFootball<ApiLineup>("/fixtures/lineups", {
      fixture: fixtureId.toString(),
    })

    // Identifier home et away (première équipe = home généralement)
    return {
      home: lineups[0] || null,
      away: lineups[1] || null,
    }
  } catch (error) {
    console.error(`❌ Erreur récupération lineups fixture ${fixtureId}:`, error)
    return { home: null, away: null }
  }
}

/**
 * Récupère les statistiques détaillées d'un match
 */
export async function getMatchStatistics(fixtureId: number): Promise<{ home: ApiStatistics | null; away: ApiStatistics | null }> {
  try {
    const stats = await fetchApiFootball<ApiStatistics>("/fixtures/statistics", {
      fixture: fixtureId.toString(),
    })

    return {
      home: stats[0] || null,
      away: stats[1] || null,
    }
  } catch (error) {
    console.error(`❌ Erreur récupération stats fixture ${fixtureId}:`, error)
    return { home: null, away: null }
  }
}

/**
 * Récupère l'historique des confrontations directes
 */
export async function getHeadToHead(homeTeamId: number, awayTeamId: number, last: number = 5): Promise<ApiHeadToHead[]> {
  try {
    const h2h = await fetchApiFootball<ApiHeadToHead>("/fixtures/headtohead", {
      h2h: `${homeTeamId}-${awayTeamId}`,
      last: last.toString(),
    })

    console.log(`📊 ${h2h.length} confrontations directes trouvées`)
    return h2h
  } catch (error) {
    console.error(`❌ Erreur récupération H2H ${homeTeamId} vs ${awayTeamId}:`, error)
    return []
  }
}

/**
 * Récupère les matchs passés d'une équipe (pour calculer les stats)
 */
export async function getTeamPastFixtures(teamId: number, last: number = 20, season?: number): Promise<ApiFixture[]> {
  try {
    const params: Record<string, string> = {
      team: teamId.toString(),
      last: last.toString(),
    }
    if (season) {
      params.season = season.toString()
    }

    const fixtures = await fetchApiFootball<ApiFixture>("/fixtures", params)
    
    // Filtrer uniquement les matchs terminés
    const finished = fixtures.filter(f => f.fixture.status.short === "FT")
    console.log(`📊 ${finished.length} matchs passés trouvés pour équipe ${teamId}`)
    return finished
  } catch (error) {
    console.error(`❌ Erreur récupération matchs passés équipe ${teamId}:`, error)
    return []
  }
}

/**
 * Enrichit un match avec TOUTES les données disponibles
 */
export interface MatchFullData {
  fixture: ApiFixture
  injuries: {
    home: ApiInjury[]
    away: ApiInjury[]
  }
  lineups: {
    home: ApiLineup | null
    away: ApiLineup | null
  }
  statistics: {
    home: ApiStatistics | null
    away: ApiStatistics | null
  }
  headToHead: ApiHeadToHead[]
}

export async function getMatchFullData(fixtureId: number): Promise<MatchFullData | null> {
  try {
    console.log(`🔍 Enrichissement complet du match ${fixtureId}...`)

    // 1. Récupérer le fixture
    const fixtures = await fetchApiFootball<ApiFixture>("/fixtures", {
      id: fixtureId.toString(),
    })

    if (fixtures.length === 0) {
      console.error(`❌ Fixture ${fixtureId} non trouvé`)
      return null
    }

    const fixture = fixtures[0]
    const homeTeamId = fixture.teams.home.id
    const awayTeamId = fixture.teams.away.id
    const season = fixture.league.season

    // 2. Récupérer toutes les données en parallèle
    const [homeInjuries, awayInjuries, lineups, statistics, headToHead] = await Promise.all([
      getTeamInjuries(homeTeamId, season),
      getTeamInjuries(awayTeamId, season),
      getMatchLineup(fixtureId),
      getMatchStatistics(fixtureId),
      getHeadToHead(homeTeamId, awayTeamId, 5),
    ])

    console.log(`✅ Match ${fixtureId} enrichi avec succès`)

    return {
      fixture,
      injuries: {
        home: homeInjuries,
        away: awayInjuries,
      },
      lineups,
      statistics,
      headToHead,
    }
  } catch (error) {
    console.error(`❌ Erreur enrichissement match ${fixtureId}:`, error)
    return null
  }
}

