/**
 * Service pour interagir avec l'API Football (Plan Ultra)
 * Documentation: https://www.api-football.com/documentation-v3
 * Plan Ultra: $29/mois - 75 000 requêtes/jour
 * 
 * DONNÉES DISPONIBLES:
 * - Fixtures (matchs à venir et passés)
 * - Injuries (blessures)
 * - Lineups (compositions)
 * - Statistics (statistiques détaillées)
 * - Head-to-head (confrontations directes)
 * - Predictions
 * - Et bien plus...
 */

import { checkRateLimit, getRateLimitUsage } from "./rate-limiter"

const API_BASE_URL = process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io"
const API_KEY = process.env.API_FOOTBALL_KEY
const API_FOOTBALL_DAILY_LIMIT = 75000 // Plan Ultra: 75 000 requêtes/jour

// Saison configurable via .env, sinon détection automatique
const getCurrentSeason = (): number => {
  if (process.env.FOOTBALL_SEASON) {
    return parseInt(process.env.FOOTBALL_SEASON, 10)
  }
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12
  // Si on est entre juillet et décembre, on est dans la saison année/année+1
  // Sinon, on est dans la saison année-1/année
  return currentMonth >= 7 ? currentYear : currentYear - 1
}

if (!API_KEY) {
  console.warn("⚠️ API_FOOTBALL_KEY non configurée. Utilisation de données mockées.")
}

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

interface ApiTeam {
  team: {
    id: number
    name: string
    code: string | null
    country: string
    founded: number | null
    national: boolean
    logo: string
  }
  venue: {
    id: number
    name: string
    address: string | null
    city: string
    capacity: number
    surface: string
    image: string
  }
}

interface ApiFixture {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    periods: {
      first: number | null
      second: number | null
    }
    venue: {
      id: number | null
      name: string
      city: string
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
    extratime: {
      home: number | null
      away: number | null
    }
    penalty: {
      home: number | null
      away: number | null
    }
  }
}

interface ApiStanding {
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
    standings: Array<{
      rank: number
      team: {
        id: number
        name: string
        logo: string
      }
      points: number
      goalsDiff: number
      group: string
      form: string
      status: string
      description: string | null
      all: {
        played: number
        win: number
        draw: number
        lose: number
        goals: {
          for: number
          against: number
        }
      }
      home: {
        played: number
        win: number
        draw: number
        lose: number
        goals: {
          for: number
          against: number
        }
      }
      away: {
        played: number
        win: number
        draw: number
        lose: number
        goals: {
          for: number
          against: number
        }
      }
    }[]>
  }
}

async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  if (!API_KEY) {
    throw new Error("API_FOOTBALL_KEY non configurée")
  }

  // Vérifier le rate limit
  const allowed = await checkRateLimit("api-football", API_FOOTBALL_DAILY_LIMIT)
  if (!allowed) {
    const usage = await getRateLimitUsage("api-football")
    throw new Error(
      `Limite API-Football atteinte: ${usage}/${API_FOOTBALL_DAILY_LIMIT} requêtes utilisées aujourd'hui. Réessayez demain.`
    )
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  // Log de l'URL appelée (sans la clé pour la sécurité)
  const urlForLog = url.toString().replace(API_KEY || "", "***")
  console.log(`🌐 URL appelée: ${urlForLog}`)

  const response = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io",
      // Alternative: certains endpoints utilisent x-apisports-key
      // "x-apisports-key": API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ API Football erreur ${response.status}:`, error)
    throw new Error(`API Football error: ${response.status} - ${error}`)
  }

  const data: ApiFootballResponse<T> = await response.json()

  // Log détaillé de la réponse
  console.log(`📥 Réponse API: ${data.results} résultats`)
  if (data.errors && data.errors.length > 0) {
    console.warn("⚠️ API Football erreurs:", JSON.stringify(data.errors, null, 2))
  }
  if (data.response && data.response.length > 0) {
    console.log(`   ✅ Premier résultat trouvé`)
  } else {
    console.log(`   ⚠️ Aucun résultat dans la réponse`)
  }

  return data.response
}

/**
 * Récupère les matchs à venir pour les ligues principales
 * OPTIMISÉ: Limite à 4 ligues principales pour économiser les requêtes (4 req au lieu de 7)
 */
export async function getUpcomingFixtures(days: number = 7): Promise<ApiFixture[]> {
  try {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    console.log(`🔍 Recherche de matchs du ${today.toISOString().split("T")[0]} au ${futureDate.toISOString().split("T")[0]}`)

    // OPTIMISATION: Limiter à 4 ligues principales pour économiser les requêtes
    // (7 ligues = 7 requêtes, on réduit à 4 pour rester sous la limite)
    const leagueIds = [
      "39", // Premier League
      "140", // La Liga
      "135", // Serie A
      "61", // Ligue 1
      // "78", // Bundesliga (désactivé pour économiser)
      // "2", // UEFA Champions League (désactivé pour économiser)
      // "3", // UEFA Europa League (désactivé pour économiser)
    ]

    const allFixtures: ApiFixture[] = []

    // Vérifier le nombre de requêtes restantes
    const usage = await getRateLimitUsage("api-football")
    const remaining = API_FOOTBALL_DAILY_LIMIT - usage

    if (remaining < leagueIds.length) {
      console.warn(
        `⚠️ Seulement ${remaining} requêtes restantes. Limitation à ${Math.max(1, remaining - 1)} ligues.`
      )
      // Limiter le nombre de ligues selon les requêtes restantes
      leagueIds.splice(Math.max(1, remaining - 1))
    }

    // Déterminer la saison actuelle
    const season = getCurrentSeason()
    console.log(`📅 Saison utilisée: ${season}/${season + 1}`)

    for (const leagueId of leagueIds) {
      try {
        const fromDate = today.toISOString().split("T")[0]
        const toDate = futureDate.toISOString().split("T")[0]
        
        console.log(`📡 Appel API pour ligue ${leagueId} (${fromDate} -> ${toDate}, saison ${season})`)
        
        // Essayer différentes combinaisons de paramètres
        let fixtures: ApiFixture[] = []
        
        // Essai 1: Avec season et status NS
        try {
          fixtures = await fetchApi<ApiFixture>("/fixtures", {
            league: leagueId,
            season: season.toString(),
            from: fromDate,
            to: toDate,
            status: "NS", // Not Started
          })
        } catch (error) {
          console.log(`⚠️ Essai 1 échoué, essai sans season...`)
          // Essai 2: Sans season mais avec status NS
          try {
            fixtures = await fetchApi<ApiFixture>("/fixtures", {
              league: leagueId,
              from: fromDate,
              to: toDate,
              status: "NS",
            })
          } catch (err2) {
            console.log(`⚠️ Essai 2 échoué, essai sans filtre status...`)
            // Essai 3: Sans season et sans filtre status (tous les matchs)
            try {
              fixtures = await fetchApi<ApiFixture>("/fixtures", {
                league: leagueId,
                season: season.toString(),
                from: fromDate,
                to: toDate,
                // Pas de filtre status
              })
            } catch (err3) {
              console.error(`❌ Tous les essais ont échoué pour ligue ${leagueId}`)
              // Ne pas throw, continuer avec les autres ligues
              fixtures = []
            }
          }
        }
        
        // Filtrer uniquement les matchs "Not Started" si on les a récupérés sans filtre
        const nsFixtures = fixtures.filter(f => f.fixture.status.short === "NS")
        
        console.log(`✅ ${fixtures.length} matchs trouvés (${nsFixtures.length} non commencés) pour la ligue ${leagueId}`)
        if (nsFixtures.length > 0) {
          const firstMatch = nsFixtures[0]
          console.log(`   📍 Premier match: ${firstMatch.teams.home.name} vs ${firstMatch.teams.away.name}`)
          console.log(`   📅 Date: ${firstMatch.fixture.date}`)
          console.log(`   🏆 Ligue: ${firstMatch.league.name}`)
          console.log(`   📊 Statut: ${firstMatch.fixture.status.long}`)
        } else if (fixtures.length > 0) {
          console.log(`   ⚠️ ${fixtures.length} matchs trouvés mais aucun avec statut "NS"`)
          console.log(`   📊 Statuts trouvés: ${[...new Set(fixtures.map(f => f.fixture.status.short))].join(", ")}`)
        } else {
          console.log(`   ⚠️ Aucun match trouvé pour cette ligue dans cette période`)
        }
        
        // Utiliser uniquement les matchs non commencés
        allFixtures.push(...nsFixtures)
      } catch (error) {
        console.error(`❌ Erreur pour la ligue ${leagueId}:`, error instanceof Error ? error.message : error)
        // Si erreur de rate limit, arrêter
        if (error instanceof Error && error.message.includes("Limite API-Football atteinte")) {
          console.error("🛑 Limite API atteinte, arrêt de la synchronisation")
          break
        }
        // Si clé API non configurée, arrêter aussi
        if (error instanceof Error && error.message.includes("API_FOOTBALL_KEY non configurée")) {
          console.error("🛑 Clé API non configurée")
          break
        }
      }
    }

    console.log(`📊 Total: ${allFixtures.length} matchs trouvés`)

    return allFixtures.sort((a, b) => {
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des matchs:", error)
    return []
  }
}

/**
 * Récupère les statistiques d'une équipe dans une ligue
 */
export async function getTeamStats(teamId: number, leagueId: string, season?: number): Promise<ApiStanding | null> {
  // Si pas de saison spécifiée, utiliser la saison actuelle
  if (!season) {
    season = getCurrentSeason()
  }
  try {
    const standings = await fetchApi<ApiStanding>("/standings", {
      league: leagueId,
      season: season.toString(),
      team: teamId.toString(),
    })

    return standings[0] || null
  } catch (error) {
    console.error(`Erreur lors de la récupération des stats de l'équipe ${teamId}:`, error)
    return null
  }
}

/**
 * Récupère les 5 derniers matchs d'une équipe pour la forme
 */
export async function getTeamForm(teamId: number, leagueId: string): Promise<string> {
  try {
    const fixtures = await fetchApi<ApiFixture>("/fixtures", {
      team: teamId.toString(),
      league: leagueId,
      last: "5",
      status: "FT", // Full Time
    })

    if (fixtures.length === 0) return "N/A"

    const form = fixtures
      .map((fixture) => {
        const isHome = fixture.teams.home.id === teamId
        const homeScore = fixture.goals.home || 0
        const awayScore = fixture.goals.away || 0

        if (isHome) {
          if (homeScore > awayScore) return "W"
          if (homeScore < awayScore) return "L"
          return "D"
        } else {
          if (awayScore > homeScore) return "W"
          if (awayScore < homeScore) return "L"
          return "D"
        }
      })
      .reverse()
      .join("-")

    return form || "N/A"
  } catch (error) {
    console.error(`Erreur lors de la récupération de la forme de l'équipe ${teamId}:`, error)
    return "N/A"
  }
}

/**
 * Récupère les informations d'une équipe
 */
export async function getTeamInfo(teamId: number): Promise<ApiTeam | null> {
  try {
    const teams = await fetchApi<ApiTeam>("/teams", {
      id: teamId.toString(),
    })

    return teams[0] || null
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'équipe ${teamId}:`, error)
    return null
  }
}

