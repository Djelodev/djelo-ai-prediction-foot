/**
 * Endpoint pour enrichir un match avec toutes les données disponibles
 * GET /api/enrich?matchId=1
 * POST /api/enrich (enrichit tous les matchs à venir)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getMatchFullData } from "@/lib/api-football-ultra"
import { getMatchWeather } from "@/lib/football-enrichment"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get("matchId")

    if (!matchId) {
      return NextResponse.json({ error: "matchId requis" }, { status: 400 })
    }

    const match = await db.match.findUnique({
      where: { id: parseInt(matchId, 10) },
      include: { homeTeam: true, awayTeam: true },
    })

    if (!match) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 })
    }

    if (!match.apiId) {
      return NextResponse.json({ error: "Match n'a pas d'apiId (API-Football requis)" }, { status: 400 })
    }

    console.log(`🔍 Enrichissement du match ${match.id} (fixture ${match.apiId})...`)

    // Récupérer toutes les données depuis API-Football
    const fullData = await getMatchFullData(match.apiId)

    if (!fullData) {
      return NextResponse.json({ error: "Impossible de récupérer les données" }, { status: 500 })
    }

    // Récupérer la météo
    const weather = match.city && match.country
      ? await getMatchWeather(match.city, match.country, match.date)
      : null

    // Sauvegarder l'enrichissement
    await db.matchEnrichment.upsert({
      where: { matchId: match.id },
      create: {
        matchId: match.id,
        homeInjuries: JSON.stringify(fullData.injuries.home),
        awayInjuries: JSON.stringify(fullData.injuries.away),
        homeLineup: fullData.lineups.home ? JSON.stringify(fullData.lineups.home) : null,
        awayLineup: fullData.lineups.away ? JSON.stringify(fullData.lineups.away) : null,
        weather: weather ? JSON.stringify(weather) : null,
      },
      update: {
        homeInjuries: JSON.stringify(fullData.injuries.home),
        awayInjuries: JSON.stringify(fullData.injuries.away),
        homeLineup: fullData.lineups.home ? JSON.stringify(fullData.lineups.home) : null,
        awayLineup: fullData.lineups.away ? JSON.stringify(fullData.lineups.away) : null,
        weather: weather ? JSON.stringify(weather) : null,
      },
    })

    return NextResponse.json({
      success: true,
      matchId: match.id,
      enrichment: {
        injuries: {
          home: fullData.injuries.home.length,
          away: fullData.injuries.away.length,
        },
        lineups: {
          home: fullData.lineups.home ? "Disponible" : "Non disponible",
          away: fullData.lineups.away ? "Disponible" : "Non disponible",
        },
        statistics: {
          home: fullData.statistics.home ? "Disponible" : "Non disponible",
          away: fullData.statistics.away ? "Disponible" : "Non disponible",
        },
        headToHead: fullData.headToHead.length,
        weather: weather ? "Disponible" : "Non disponible",
      },
    })
  } catch (error) {
    console.error("❌ Erreur API enrich:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'enrichissement",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const matchId = body.matchId

    if (matchId) {
      // Enrichir un match spécifique
      const req = new NextRequest(`http://localhost/api/enrich?matchId=${matchId}`)
      return GET(req)
    }

    // Enrichir tous les matchs à venir
    const upcomingMatches = await db.match.findMany({
      where: {
        date: { gte: new Date() },
        status: "scheduled",
        apiId: { not: null },
      },
      include: { enrichment: true },
      orderBy: { date: "asc" },
      take: 20, // Limiter à 20 pour éviter trop de requêtes
    })

    const results = []
    for (const match of upcomingMatches) {
      // Ne pas enrichir si déjà enrichi récemment (< 6h)
      if (match.enrichment) {
        const age = Date.now() - new Date(match.enrichment.updatedAt).getTime()
        if (age < 6 * 60 * 60 * 1000) {
          console.log(`⏭️ Match ${match.id} déjà enrichi récemment, skip`)
          continue
        }
      }

      try {
        const req = new NextRequest(`http://localhost/api/enrich?matchId=${match.id}`)
        const response = await GET(req)
        const data = await response.json()
        results.push({ matchId: match.id, success: data.success })
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Erreur enrichissement match ${match.id}:`, error)
        results.push({ matchId: match.id, success: false, error: error instanceof Error ? error.message : "Unknown" })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter(r => r.success).length} matchs enrichis`,
      results,
    })
  } catch (error) {
    console.error("❌ Erreur API enrich POST:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'enrichissement",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

