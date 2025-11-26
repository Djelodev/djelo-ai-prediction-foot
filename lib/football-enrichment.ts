/**
 * Service d'enrichissement des données football
 * Combine plusieurs APIs pour obtenir des données complètes :
 * - API-Football (RapidAPI) : Injuries, Lineups, Suspensions
 * - OpenWeatherMap : Météo
 * 
 * STRATÉGIE :
 * - Football-Data.org : Matchs à venir (déjà implémenté)
 * - API-Football : Données complémentaires (injuries, lineups)
 * - OpenWeatherMap : Météo
 */

import { checkRateLimit } from "./rate-limiter"

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || ""
const API_FOOTBALL_DAILY_LIMIT = 100 // Plan gratuit

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ""
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

interface ApiFootballResponse<T> {
  get: string
  parameters: Record<string, unknown>
  errors: unknown[]
  results: number
  response: T[]
}

interface Injury {
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
  reason: string // Description de la blessure/suspension
}

interface Lineup {
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

interface WeatherData {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number
  }
  visibility: number
}

/**
 * Récupère les blessures et suspensions d'une équipe
 */
export async function getTeamInjuries(teamId: number): Promise<Injury[]> {
  if (!API_FOOTBALL_KEY) {
    console.warn("⚠️ API_FOOTBALL_KEY non configurée, impossible de récupérer les blessures")
    return []
  }

  try {
    // Vérifier le rate limit
    const allowed = await checkRateLimit("api-football", API_FOOTBALL_DAILY_LIMIT)
    if (!allowed) {
      console.warn("⚠️ Limite API-Football atteinte pour les blessures")
      return []
    }

    // Support des deux méthodes d'authentification
    const headers: Record<string, string> = {
      "x-rapidapi-host": "v3.football.api-sports.io",
    }
    if (API_FOOTBALL_KEY.toLowerCase().includes("rapidapi")) {
      headers["x-rapidapi-key"] = API_FOOTBALL_KEY
    } else {
      // Dashboard API-Football (par défaut)
      headers["x-apisports-key"] = API_FOOTBALL_KEY
    }

    const response = await fetch(
      `${API_FOOTBALL_BASE_URL}/injuries?team=${teamId}&season=${new Date().getFullYear()}`,
      { headers }
    )

    if (!response.ok) {
      console.error(`❌ Erreur API-Football injuries: ${response.status}`)
      return []
    }

    const data = await response.json() as ApiFootballResponse<Injury>
    return data.response || []
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des blessures:", error)
    return []
  }
}

/**
 * Récupère la composition probable d'un match
 */
export async function getMatchLineup(fixtureId: number): Promise<{ home: Lineup | null; away: Lineup | null }> {
  if (!API_FOOTBALL_KEY) {
    console.warn("⚠️ API_FOOTBALL_KEY non configurée, impossible de récupérer les lineups")
    return { home: null, away: null }
  }

  try {
    // Vérifier le rate limit
    const allowed = await checkRateLimit("api-football", API_FOOTBALL_DAILY_LIMIT)
    if (!allowed) {
      console.warn("⚠️ Limite API-Football atteinte pour les lineups")
      return { home: null, away: null }
    }

    // Support des deux méthodes d'authentification
    const headers: Record<string, string> = {
      "x-rapidapi-host": "v3.football.api-sports.io",
    }
    if (API_FOOTBALL_KEY.toLowerCase().includes("rapidapi")) {
      headers["x-rapidapi-key"] = API_FOOTBALL_KEY
    } else {
      // Dashboard API-Football (par défaut)
      headers["x-apisports-key"] = API_FOOTBALL_KEY
    }

    const response = await fetch(
      `${API_FOOTBALL_BASE_URL}/fixtures/lineups?fixture=${fixtureId}`,
      { headers }
    )

    if (!response.ok) {
      console.error(`❌ Erreur API-Football lineups: ${response.status}`)
      return { home: null, away: null }
    }

    const data = await response.json() as ApiFootballResponse<Lineup>
    const lineups = data.response || []
    
    // Séparer home et away (première équipe = home, deuxième = away)
    return {
      home: lineups[0] || null,
      away: lineups[1] || null,
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des lineups:", error)
    return { home: null, away: null }
  }
}

/**
 * Récupère la météo pour un match (basé sur la ville du stade)
 */
export async function getMatchWeather(city: string, country: string, matchDate: Date): Promise<WeatherData | null> {
  if (!OPENWEATHER_API_KEY) {
    console.warn("⚠️ OPENWEATHER_API_KEY non configurée, impossible de récupérer la météo")
    return null
  }

  try {
    // Utiliser l'API de prévision pour obtenir la météo au moment du match
    const lat = 0 // À améliorer : géocoder la ville pour obtenir lat/lon
    const lon = 0
    
    // Pour l'instant, utiliser l'API actuelle (météo actuelle)
    // TODO: Utiliser l'API de prévision pour la date du match
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?q=${city},${country}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`
    )

    if (!response.ok) {
      console.error(`❌ Erreur OpenWeather: ${response.status}`)
      return null
    }

    const data = await response.json() as WeatherData
    return data
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la météo:", error)
    return null
  }
}

/**
 * Enrichit un match avec toutes les données complémentaires
 */
export interface MatchEnrichment {
  injuries: {
    home: Injury[]
    away: Injury[]
  }
  lineups: {
    home: Lineup | null
    away: Lineup | null
  }
  weather: WeatherData | null
}

export async function enrichMatch(
  homeTeamApiId: number,
  awayTeamApiId: number,
  fixtureId: number | null,
  city: string,
  country: string,
  matchDate: Date
): Promise<MatchEnrichment> {
  console.log(`🔍 Enrichissement du match ${fixtureId || 'N/A'}...`)

  // Récupérer les blessures (en parallèle)
  const [homeInjuries, awayInjuries] = await Promise.all([
    getTeamInjuries(homeTeamApiId),
    getTeamInjuries(awayTeamApiId),
  ])

  // Récupérer les lineups (si fixtureId disponible)
  const lineups = fixtureId ? await getMatchLineup(fixtureId) : { home: null, away: null }

  // Récupérer la météo
  const weather = await getMatchWeather(city, country, matchDate)

  return {
    injuries: {
      home: homeInjuries,
      away: awayInjuries,
    },
    lineups,
    weather,
  }
}

