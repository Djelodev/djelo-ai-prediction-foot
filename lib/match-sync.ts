/**
 * Service de synchronisation des matchs depuis l'API Football vers la base de données
 */

import { db } from "./db"
import { getUpcomingFixtures as getUpcomingFixturesFootballData, getPastFixtures, convertFootballDataMatch } from "./football-data"
import { getUpcomingFixtures as getUpcomingFixturesApiFootball, getTeamPastFixtures } from "./api-football-ultra"
import { getCache, setCache } from "./cache"
import { generateShortName } from "./team-utils"

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

/**
 * Synchronise les matchs depuis API-Football (Plan Ultra)
 */
export async function syncMatchesFromAPI(days: number = 7): Promise<number> {
  try {
    console.log("🔄 Synchronisation des matchs depuis API-Football Ultra...")

    // Vérifier si API-Football est configuré
    if (!process.env.API_FOOTBALL_KEY) {
      console.warn("⚠️ API_FOOTBALL_KEY non configurée, utilisation de Football-Data.org en fallback")
      // Fallback vers Football-Data.org
      return syncMatchesFromFootballData(days)
    }

    // OPTIMISATION: Cache plus long (3 heures) pour réduire les appels API
    const cacheKey = `fixtures-api-football-${days}days-${new Date().toISOString().split("T")[0]}`
    const cached = await getCache<Awaited<ReturnType<typeof getUpcomingFixturesApiFootball>>>(cacheKey)
    
    let fixtures: Awaited<ReturnType<typeof getUpcomingFixturesApiFootball>>
    if (cached && cached.length > 0) {
      console.log(`📦 Utilisation du cache: ${cached.length} matchs`)
      fixtures = cached
    } else {
      console.log(`🔄 Cache vide ou expiré, nouvel appel API-Football...`)
      fixtures = await getUpcomingFixturesApiFootball(days)
      if (fixtures.length > 0) {
        await setCache(cacheKey, fixtures, 3 * 60 * 60 * 1000)
      }
    }

    if (fixtures.length === 0) {
      console.log("⚠️ Aucun match trouvé")
      return 0
    }

    let syncedCount = 0

    for (const fixture of fixtures) {
      try {
        const competitionName = fixture.league.name || "Unknown League"

        // Récupérer ou créer les équipes
        const homeTeam = await getOrCreateTeam(
          fixture.teams.home.id,
          fixture.teams.home.name,
          competitionName,
          (fixture as any)?.teams?.home?.logo
        )
        const awayTeam = await getOrCreateTeam(
          fixture.teams.away.id,
          fixture.teams.away.name,
          competitionName,
          (fixture as any)?.teams?.away?.logo
        )

        // Créer ou mettre à jour le match
        const matchDate = new Date(fixture.fixture.date)
        const hour = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

        await db.match.upsert({
          where: { apiId: fixture.fixture.id },
          create: {
            apiId: fixture.fixture.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            league: competitionName,
            leagueId: fixture.league.id.toString(),
            date: matchDate,
            hour: hour,
            status: fixture.fixture.status.short === "NS" ? "scheduled" : fixture.fixture.status.short === "FT" ? "finished" : "live",
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            venue: fixture.fixture.venue.name,
            city: fixture.fixture.venue.city,
            country: fixture.fixture.venue.country || fixture.league.country,
          },
          update: {
            status: fixture.fixture.status.short === "NS" ? "scheduled" : fixture.fixture.status.short === "FT" ? "finished" : "live",
            homeScore: fixture.goals.home,
            awayScore: fixture.goals.away,
            venue: fixture.fixture.venue.name,
            city: fixture.fixture.venue.city,
            country: fixture.fixture.venue.country || fixture.league.country,
          },
        })

        syncedCount++
      } catch (error) {
        console.error(`Erreur lors de la synchronisation du match ${fixture.fixture.id}:`, error)
      }
    }

    console.log(`✅ ${syncedCount} matchs synchronisés depuis API-Football`)
    return syncedCount
  } catch (error) {
    console.error("Erreur lors de la synchronisation des matchs:", error)
    // Fallback vers Football-Data.org en cas d'erreur
    if (error instanceof Error && error.message.includes("API_FOOTBALL_KEY")) {
      return syncMatchesFromFootballData(days)
    }
    return 0
  }
}

/**
 * Fallback: Synchronise depuis Football-Data.org
 */
async function syncMatchesFromFootballData(days: number = 7): Promise<number> {
  try {
    console.log("🔄 Fallback: Synchronisation depuis Football-Data.org...")
    const cacheKey = `fixtures-${days}days-${new Date().toISOString().split("T")[0]}`
    const cached = await getCache<Awaited<ReturnType<typeof getUpcomingFixturesFootballData>>>(cacheKey)
    
    let fixtures: Awaited<ReturnType<typeof getUpcomingFixturesFootballData>>
    if (cached && cached.length > 0) {
      fixtures = cached
    } else {
      fixtures = await getUpcomingFixturesFootballData(days)
      if (fixtures.length > 0) {
        await setCache(cacheKey, fixtures, 3 * 60 * 60 * 1000)
      }
    }

    if (fixtures.length === 0) {
      return 0
    }

    let syncedCount = 0
    for (const match of fixtures) {
      try {
        const competitionName = COMPETITION_NAMES[match.competition?.code || ""] || "Unknown League"
        const homeTeam = await getOrCreateTeam(match.homeTeam.id, match.homeTeam.name, competitionName, match.homeTeam.crest || null)
        const awayTeam = await getOrCreateTeam(match.awayTeam.id, match.awayTeam.name, competitionName, match.awayTeam.crest || null)
        const matchDate = new Date(match.utcDate)
        const hour = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

        await db.match.upsert({
          where: { apiId: match.id },
          create: {
            apiId: match.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            league: competitionName,
            leagueId: match.competition?.code || "",
            date: matchDate,
            hour: hour,
            status: match.status === "SCHEDULED" ? "scheduled" : match.status === "FINISHED" ? "finished" : "live",
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
          },
          update: {
            status: match.status === "SCHEDULED" ? "scheduled" : match.status === "FINISHED" ? "finished" : "live",
            homeScore: match.score.fullTime.home,
            awayScore: match.score.fullTime.away,
          },
        })
        syncedCount++
      } catch (error) {
        console.error(`Erreur sync match ${match.id}:`, error)
      }
    }
    return syncedCount
  } catch (error) {
    console.error("Erreur sync Football-Data:", error)
    return 0
  }
}

/**
 * Récupère ou crée une équipe
 */
async function getOrCreateTeam(apiId: number, name: string, league: string, logo?: string | null) {
  let team = await db.team.findUnique({
    where: { apiId },
  })

  if (!team) {
    // OPTIMISATION: Ne pas appeler getTeamInfo pour économiser les requêtes API
    // Le logo n'est pas essentiel pour les prédictions
    team = await db.team.create({
      data: {
        apiId,
        name,
        logo: logo || null,
        shortName: generateShortName(name),
        league,
      },
    })
  } else if (
    team.name !== name ||
    team.league !== league ||
    (!team.logo && logo) ||
    !team.shortName
  ) {
    // Mettre à jour si nécessaire
    team = await db.team.update({
      where: { id: team.id },
      data: {
        name,
        league,
        ...(logo && !team.logo ? { logo } : {}),
        ...( !team.shortName || team.name !== name ? { shortName: generateShortName(name) } : {}),
      },
    })
  }

  return team
}

/**
 * Synchronise les matchs passés et calcule les statistiques des équipes
 */
export async function syncPastMatchesAndUpdateStats(days: number = 30): Promise<number> {
  try {
    console.log("🔄 Synchronisation des matchs passés pour calculer les stats...")

    // Utiliser API-Football si disponible, sinon Football-Data.org
    let pastFixtures: any[] = []
    
    if (process.env.API_FOOTBALL_KEY) {
      // Utiliser API-Football pour récupérer les matchs passés de toutes les équipes
      // On récupère les équipes de la base et on récupère leurs matchs passés
      const teams = await db.team.findMany({ take: 50 }) // Limiter pour éviter trop de requêtes
      console.log(`📊 Récupération des matchs passés pour ${teams.length} équipes...`)
      
      for (const team of teams) {
        if (team.apiId) {
          try {
            const teamFixtures = await getTeamPastFixtures(team.apiId, 20)
            pastFixtures.push(...teamFixtures)
          } catch (error) {
            console.error(`Erreur récupération matchs passés équipe ${team.apiId}:`, error)
          }
        }
      }
    } else {
      // Fallback vers Football-Data.org
      pastFixtures = await getPastFixtures(days)
    }

    if (pastFixtures.length === 0) {
      console.log("⚠️ Aucun match passé trouvé")
      return 0
    }

    let syncedCount = 0
    const teamStatsMap = new Map<number, { wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>()

    for (const match of pastFixtures) {
      try {
        // Gérer les deux formats : API-Football et Football-Data.org
        const isApiFootball = 'fixture' in match
        const competitionName = isApiFootball 
          ? (match as any).league?.name || "Unknown League"
          : COMPETITION_NAMES[(match as any).competition?.code || ""] || "Unknown League"
        
        const homeTeamId = isApiFootball ? (match as any).teams.home.id : (match as any).homeTeam.id
        const awayTeamId = isApiFootball ? (match as any).teams.away.id : (match as any).awayTeam.id
        const homeTeamName = isApiFootball ? (match as any).teams.home.name : (match as any).homeTeam.name
        const awayTeamName = isApiFootball ? (match as any).teams.away.name : (match as any).awayTeam.name
        const matchId = isApiFootball ? (match as any).fixture.id : (match as any).id
        const matchDate = isApiFootball ? new Date((match as any).fixture.date) : new Date((match as any).utcDate)
        const status = isApiFootball ? (match as any).fixture.status.short : (match as any).status
        const homeScore = isApiFootball ? (match as any).goals.home : (match as any).score.fullTime.home
        const awayScore = isApiFootball ? (match as any).goals.away : (match as any).score.fullTime.away
        const leagueId = isApiFootball ? (match as any).league.id.toString() : (match as any).competition?.code || ""

        const homeTeam = await getOrCreateTeam(homeTeamId, homeTeamName, competitionName, isApiFootball ? (match as any).teams?.home?.logo : (match as any).homeTeam.crest || null)
        const awayTeam = await getOrCreateTeam(awayTeamId, awayTeamName, competitionName, isApiFootball ? (match as any).teams?.away?.logo : (match as any).awayTeam.crest || null)

        // Ne synchroniser que les matchs finis avec scores
        if (status === "FT" || status === "FINISHED") {
          if (homeScore !== null && awayScore !== null) {
            const hour = matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

            await db.match.upsert({
              where: { apiId: matchId },
              create: {
                apiId: matchId,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                league: competitionName,
                leagueId: leagueId,
                date: matchDate,
                hour: hour,
                status: "finished",
                homeScore: homeScore,
                awayScore: awayScore,
              },
              update: {
                status: "finished",
                homeScore: homeScore,
                awayScore: awayScore,
              },
            })

            // Calculer les stats pour chaque équipe
            if (!teamStatsMap.has(homeTeam.id)) {
              teamStatsMap.set(homeTeam.id, { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 })
            }
            const homeStats = teamStatsMap.get(homeTeam.id)!
            homeStats.goalsFor += homeScore
            homeStats.goalsAgainst += awayScore
            if (homeScore > awayScore) homeStats.wins++
            else if (homeScore === awayScore) homeStats.draws++
            else homeStats.losses++

            if (!teamStatsMap.has(awayTeam.id)) {
              teamStatsMap.set(awayTeam.id, { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 })
            }
            const awayStats = teamStatsMap.get(awayTeam.id)!
            awayStats.goalsFor += awayScore
            awayStats.goalsAgainst += homeScore
            if (awayScore > homeScore) awayStats.wins++
            else if (awayScore === homeScore) awayStats.draws++
            else awayStats.losses++

            syncedCount++
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation du match passé:`, error)
      }
    }

    // Mettre à jour les stats des équipes dans la base
    for (const [teamId, stats] of teamStatsMap.entries()) {
      try {
        await db.team.update({
          where: { id: teamId },
          data: stats,
        })
      } catch (error) {
        console.error(`Erreur lors de la mise à jour des stats pour l'équipe ${teamId}:`, error)
      }
    }

    console.log(`✅ ${syncedCount} matchs passés synchronisés, stats de ${teamStatsMap.size} équipes mises à jour`)
    return syncedCount
  } catch (error) {
    console.error("Erreur lors de la synchronisation des matchs passés:", error)
    return 0
  }
}

/**
 * Met à jour les statistiques des équipes depuis l'API
 */
export async function updateTeamStats(teamId: number, leagueId: string): Promise<void> {
  // Cette fonction peut être étendue pour mettre à jour les stats depuis l'API
  // Pour l'instant, on utilise les stats stockées dans la base
}

/**
 * Récupère la forme récente d'une équipe
 * NOTE: Football-Data.org ne fournit pas directement la forme récente
 * On retourne "N/A" pour l'instant, peut être amélioré avec les matchs passés
 */
export async function getTeamRecentForm(teamId: number, leagueId: string): Promise<string> {
  // Pour l'instant, on retourne N/A car Football-Data.org ne fournit pas directement la forme
  // On pourrait calculer la forme depuis les matchs passés stockés en base
  return "N/A"
}

