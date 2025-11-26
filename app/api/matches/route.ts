/**
 * Endpoint API pour récupérer les matchs
 * GET /api/matches?league=premier-league&days=7
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateShortName } from "@/lib/team-utils"

export const dynamic = "force-dynamic"

/**
 * Détermine la prédiction 1N2 avec double chance si confiance faible
 */
function formatPredictionFromDB(win1: number, draw: number, win2: number, predictedScore: string | null, btts: number, over25: number, analysis: string | null) {
  const maxProb = Math.max(win1, draw, win2)
  const confidence = Math.round(maxProb * 100)
  
  // Si confiance < 50%, utiliser double chance
  let prediction_1n2: "1" | "X" | "2" | "1X" | "X2" | "12"
  let confidence_1n2: number
  
  if (confidence < 50) {
    const prob1X = win1 + draw
    const probX2 = win2 + draw
    const prob12 = win1 + win2
    
    if (prob1X >= probX2 && prob1X >= prob12) {
      prediction_1n2 = "1X"
      confidence_1n2 = Math.round(prob1X * 100)
    } else if (probX2 >= prob1X && probX2 >= prob12) {
      prediction_1n2 = "X2"
      confidence_1n2 = Math.round(probX2 * 100)
    } else {
      prediction_1n2 = "12"
      confidence_1n2 = Math.round(prob12 * 100)
    }
  } else {
    if (win1 > draw && win1 > win2) {
      prediction_1n2 = "1"
      confidence_1n2 = confidence
    } else if (win2 > draw && win2 > win1) {
      prediction_1n2 = "2"
      confidence_1n2 = confidence
    } else {
      prediction_1n2 = "X"
      confidence_1n2 = confidence
    }
  }
  
  return {
    prediction_1n2,
    confidence_1n2,
    predicted_score: predictedScore || "1-1",
    confidence_score: 40,
    btts: btts > 0.5,
    confidence_btts: Math.round(btts * 100),
    over_under_2_5: over25 > 0.5 ? "OVER" : "UNDER",
    confidence_ou25: Math.round(over25 * 100),
    analysis: analysis || "Analyse non disponible",
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const league = searchParams.get("league")
    const days = parseInt(searchParams.get("days") || "7", 10)

    // IMPORTANT: Ne plus synchroniser automatiquement depuis l'API externe
    // Les matchs sont chargés UNIQUEMENT depuis la base de données
    // La synchronisation doit être faite manuellement via /api/sync
    
    // Récupérer les matchs depuis la base de données uniquement
    const now = new Date()
    
    // Calculer la date limite (jours dans le futur)
    const maxDate = new Date(now)
    maxDate.setDate(maxDate.getDate() + days)

    const where: {
      date?: { gte: Date; lte?: Date }
      league?: string
      status?: string
    } = {
      date: {
        gte: now,
        lte: maxDate,
      },
      status: "scheduled",
    }

    if (league) {
      where.league = league
    }

    console.log(`🔍 Recherche de matchs depuis la base de données:`, {
      dateMin: now.toISOString(),
      dateMax: maxDate.toISOString(),
      status: "scheduled",
      league: league || "toutes",
    })

    const matches = await db.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        prediction: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 50, // Limiter à 50 matchs
    })

    console.log(`📊 ${matches.length} matchs trouvés dans la base de données`)

    // Si aucun match avec status "scheduled", essayer sans filtre de statut
    if (matches.length === 0) {
      console.log(`⚠️ Aucun match avec status "scheduled", recherche sans filtre de statut...`)
      const allMatches = await db.match.findMany({
        where: {
          date: {
            gte: now,
            lte: maxDate, // maxDate est déjà défini plus haut
          },
          ...(league ? { league } : {}),
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          prediction: true,
        },
        orderBy: {
          date: "asc",
        },
        take: 50,
      })
      console.log(`📊 ${allMatches.length} matchs trouvés sans filtre de statut`)
      
      // Utiliser ces matchs et mettre à jour leur statut si nécessaire
      if (allMatches.length > 0) {
        console.log(`   Statuts trouvés: ${[...new Set(allMatches.map(m => m.status))].join(", ")}`)
        // Mettre à jour les statuts si nécessaire
        for (const match of allMatches) {
          if (match.status !== "scheduled" && match.status !== "finished" && match.status !== "live") {
            await db.match.update({
              where: { id: match.id },
              data: { status: "scheduled" },
            })
          }
        }
        return NextResponse.json({
          matches: allMatches.map((match) => ({
            id: match.id,
            homeTeam: match.homeTeam.name,
            homeShortName: match.homeTeam.shortName || generateShortName(match.homeTeam.name),
            homeLogo: match.homeTeam.logo,
            awayTeam: match.awayTeam.name,
            awayShortName: match.awayTeam.shortName || generateShortName(match.awayTeam.name),
            awayLogo: match.awayTeam.logo,
            league: match.league,
            date: match.date.toISOString().split("T")[0],
            hour: match.hour || new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            homeForm: "N/A",
            awayForm: "N/A",
            homeStats: {
              goalsFor: match.homeTeam.goalsFor || 0,
              goalsAgainst: match.homeTeam.goalsAgainst || 0,
              wins: match.homeTeam.wins || 0,
              draws: match.homeTeam.draws || 0,
              losses: match.homeTeam.losses || 0,
            },
            awayStats: {
              goalsFor: match.awayTeam.goalsFor || 0,
              goalsAgainst: match.awayTeam.goalsAgainst || 0,
              wins: match.awayTeam.wins || 0,
              draws: match.awayTeam.draws || 0,
              losses: match.awayTeam.losses || 0,
            },
            prediction: match.prediction
              ? formatPredictionFromDB(
                  match.prediction.win1,
                  match.prediction.draw,
                  match.prediction.win2,
                  match.prediction.predictedScore,
                  match.prediction.btts,
                  match.prediction.over25,
                  match.prediction.analysis
                )
              : null,
          })),
          count: allMatches.length,
          lastUpdated: allMatches.length
            ? new Date(
                Math.max(
                  ...allMatches.map((m) => (m.updatedAt ? m.updatedAt.getTime() : 0))
                )
              ).toISOString()
            : null,
        })
      }
    }

    // Formater les matchs pour le frontend
    const formattedMatches = matches.map((match) => ({
      id: match.id,
      homeTeam: match.homeTeam.name,
      homeShortName: match.homeTeam.shortName || generateShortName(match.homeTeam.name),
      homeLogo: match.homeTeam.logo,
      awayTeam: match.awayTeam.name,
      awayShortName: match.awayTeam.shortName || generateShortName(match.awayTeam.name),
      awayLogo: match.awayTeam.logo,
      league: match.league,
      date: match.date.toISOString().split("T")[0],
      hour: match.hour || new Date(match.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      homeForm: "N/A", // Sera mis à jour avec l'API
      awayForm: "N/A",
      homeStats: {
        goalsFor: match.homeTeam.goalsFor || 0,
        goalsAgainst: match.homeTeam.goalsAgainst || 0,
        wins: match.homeTeam.wins || 0,
        draws: match.homeTeam.draws || 0,
        losses: match.homeTeam.losses || 0,
      },
      awayStats: {
        goalsFor: match.awayTeam.goalsFor || 0,
        goalsAgainst: match.awayTeam.goalsAgainst || 0,
        wins: match.awayTeam.wins || 0,
        draws: match.awayTeam.draws || 0,
        losses: match.awayTeam.losses || 0,
      },
      prediction: match.prediction
        ? formatPredictionFromDB(
            match.prediction.win1,
            match.prediction.draw,
            match.prediction.win2,
            match.prediction.predictedScore,
            match.prediction.btts,
            match.prediction.over25,
            match.prediction.analysis
          )
        : null,
    }))

    const lastUpdatedTimestamp = matches.length
      ? Math.max(...matches.map((match) => match.updatedAt?.getTime() || 0))
      : null

    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
      lastUpdated: lastUpdatedTimestamp ? new Date(lastUpdatedTimestamp).toISOString() : null,
    })
  } catch (error) {
    console.error("Erreur API matches:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des matchs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

