/**
 * Endpoint API pour générer des prédictions
 * GET /api/predictions?matchId=1
 * POST /api/predictions (génère pour tous les matchs à venir)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generatePrediction } from "@/lib/ai-prediction"
import { getTeamRecentForm } from "@/lib/match-sync"
import { withCache } from "@/lib/cache"

export const dynamic = "force-dynamic"

/**
 * Détermine la prédiction 1N2 avec double chance si confiance faible
 */
function determinePrediction1N2(win1: number, draw: number, win2: number): {
  prediction_1n2: "1" | "X" | "2" | "1X" | "X2" | "12"
  confidence_1n2: number
} {
  const maxProb = Math.max(win1, draw, win2)
  const confidence = Math.round(maxProb * 100)
  
  // Si confiance < 50%, utiliser double chance
  if (confidence < 50) {
    // Déterminer quelle double chance utiliser
    const prob1X = win1 + draw
    const probX2 = win2 + draw
    const prob12 = win1 + win2
    
    if (prob1X >= probX2 && prob1X >= prob12) {
      // 1X (victoire domicile ou nul) est la plus probable
      return {
        prediction_1n2: "1X",
        confidence_1n2: Math.round(prob1X * 100),
      }
    } else if (probX2 >= prob1X && probX2 >= prob12) {
      // X2 (nul ou victoire extérieure) est la plus probable
      return {
        prediction_1n2: "X2",
        confidence_1n2: Math.round(probX2 * 100),
      }
    } else {
      // 12 (victoire domicile ou extérieure) est la plus probable
      return {
        prediction_1n2: "12",
        confidence_1n2: Math.round(prob12 * 100),
      }
    }
  } else {
    // Confiance suffisante, prédiction simple
    if (win1 > draw && win1 > win2) {
      return {
        prediction_1n2: "1",
        confidence_1n2: confidence,
      }
    } else if (win2 > draw && win2 > win1) {
      return {
        prediction_1n2: "2",
        confidence_1n2: confidence,
      }
    } else {
      return {
        prediction_1n2: "X",
        confidence_1n2: confidence,
      }
    }
  }
}

/**
 * Calcule les statistiques avancées d'une équipe depuis les matchs précédents
 */
async function calculateTeamStats(teamId: number, leagueId: string | null) {
  const where: {
    OR: Array<{ homeTeamId: number } | { awayTeamId: number }>
    status: string
    leagueId?: string
  } = {
    OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    status: "finished",
  }

  if (leagueId) {
    where.leagueId = leagueId
  }

  const pastMatches = await db.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 20, // Derniers 20 matchs
  })

  let goalsFor = 0
  let goalsAgainst = 0
  let wins = 0
  let draws = 0
  let losses = 0
  
  // Stats séparées domicile/extérieur
  let homeWins = 0
  let homeDraws = 0
  let homeLosses = 0
  let homeGoalsFor = 0
  let homeGoalsAgainst = 0
  let homeMatches = 0
  
  let awayWins = 0
  let awayDraws = 0
  let awayLosses = 0
  let awayGoalsFor = 0
  let awayGoalsAgainst = 0
  let awayMatches = 0
  
  // Forme récente (5 derniers matchs)
  const recentMatches = pastMatches.slice(0, 5)
  let recentForm = ""
  let recentPoints = 0
  let recentGoalsFor = 0
  let recentGoalsAgainst = 0
  
  // Tendances (10 derniers vs 10 précédents)
  const last10Matches = pastMatches.slice(0, 10)
  const previous10Matches = pastMatches.slice(10, 20)
  
  let last10Points = 0
  let previous10Points = 0
  let last10GoalsFor = 0
  let previous10GoalsFor = 0
  let last10GoalsAgainst = 0
  let previous10GoalsAgainst = 0
  
  // Victoires serrées vs larges
  let narrowWins = 0 // Victoire par 1 but
  let largeWins = 0 // Victoire par 3+ buts
  let narrowLosses = 0
  let largeLosses = 0

  for (let i = 0; i < pastMatches.length; i++) {
    const match = pastMatches[i]
    if (match.homeScore === null || match.awayScore === null) continue

    const isHome = match.homeTeamId === teamId
    const teamScore = isHome ? match.homeScore : match.awayScore
    const opponentScore = isHome ? match.awayScore : match.homeScore
    const goalDiff = teamScore - opponentScore

    goalsFor += teamScore
    goalsAgainst += opponentScore

    // Stats globales
    if (teamScore > opponentScore) {
      wins++
      if (goalDiff === 1) narrowWins++
      if (goalDiff >= 3) largeWins++
    } else if (teamScore === opponentScore) {
      draws++
    } else {
      losses++
      if (goalDiff === -1) narrowLosses++
      if (goalDiff <= -3) largeLosses++
    }
    
    // Stats domicile/extérieur
    if (isHome) {
      homeMatches++
      homeGoalsFor += teamScore
      homeGoalsAgainst += opponentScore
      if (teamScore > opponentScore) homeWins++
      else if (teamScore === opponentScore) homeDraws++
      else homeLosses++
    } else {
      awayMatches++
      awayGoalsFor += teamScore
      awayGoalsAgainst += opponentScore
      if (teamScore > opponentScore) awayWins++
      else if (teamScore === opponentScore) awayDraws++
      else awayLosses++
    }
    
    // Forme récente (5 derniers)
    if (i < 5) {
      if (teamScore > opponentScore) {
        recentForm += "W"
        recentPoints += 3
      } else if (teamScore === opponentScore) {
        recentForm += "D"
        recentPoints += 1
      } else {
        recentForm += "L"
      }
      recentGoalsFor += teamScore
      recentGoalsAgainst += opponentScore
    }
    
    // Tendances (10 derniers vs 10 précédents)
    if (i < 10) {
      if (teamScore > opponentScore) last10Points += 3
      else if (teamScore === opponentScore) last10Points += 1
      last10GoalsFor += teamScore
      last10GoalsAgainst += opponentScore
    } else if (i < 20) {
      if (teamScore > opponentScore) previous10Points += 3
      else if (teamScore === opponentScore) previous10Points += 1
      previous10GoalsFor += teamScore
      previous10GoalsAgainst += opponentScore
    }
  }
  
  // Calcul des tendances
  const pointsTrend = last10Points - previous10Points // Positif = amélioration
  const goalsForTrend = last10GoalsFor - previous10GoalsFor
  const goalsAgainstTrend = last10GoalsAgainst - previous10GoalsAgainst
  
  // Surperformance (victoires serrées = chance, victoires larges = domination)
  const winQuality = pastMatches.length > 0 ? (largeWins / Math.max(1, wins)) : 0
  
  // Volatilité (écart-type des scores, simplifié)
  const avgGoalsFor = pastMatches.length > 0 ? goalsFor / pastMatches.length : 0
  const avgGoalsAgainst = pastMatches.length > 0 ? goalsAgainst / pastMatches.length : 0

  return {
    goalsFor,
    goalsAgainst,
    wins,
    draws,
    losses,
    // Stats avancées
    homeStats: {
      wins: homeWins,
      draws: homeDraws,
      losses: homeLosses,
      goalsFor: homeGoalsFor,
      goalsAgainst: homeGoalsAgainst,
      matches: homeMatches,
    },
    awayStats: {
      wins: awayWins,
      draws: awayDraws,
      losses: awayLosses,
      goalsFor: awayGoalsFor,
      goalsAgainst: awayGoalsAgainst,
      matches: awayMatches,
    },
    recentForm: recentForm || "N/A",
    recentPoints,
    recentGoalsFor,
    recentGoalsAgainst,
    trends: {
      points: pointsTrend,
      goalsFor: goalsForTrend,
      goalsAgainst: goalsAgainstTrend,
      improving: pointsTrend > 0,
      declining: pointsTrend < -3,
    },
    performance: {
      narrowWins,
      largeWins,
      narrowLosses,
      largeLosses,
      winQuality, // Ratio victoires larges / total victoires
      avgGoalsFor,
      avgGoalsAgainst,
    },
  }
}

/**
 * Génère une prédiction pour un match
 */
async function generateMatchPrediction(matchId: number) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      prediction: true,
    },
  })

  if (!match) {
    throw new Error("Match non trouvé")
  }

  // Vérifier si une prédiction existe déjà et est récente (< 6h)
  if (match.prediction) {
    const predictionAge = Date.now() - new Date(match.prediction.updatedAt).getTime()
    if (predictionAge < 6 * 60 * 60 * 1000) {
      // Prédiction récente, retourner celle-ci
      return match.prediction
    }
  }

  // Calculer les statistiques avancées
  const homeStats = await calculateTeamStats(match.homeTeamId, match.leagueId || null)
  const awayStats = await calculateTeamStats(match.awayTeamId, match.leagueId || null)

  // Utiliser la forme récente calculée
  const homeForm = homeStats.recentForm || "N/A"
  const awayForm = awayStats.recentForm || "N/A"

  // Mettre à jour les stats des équipes si nécessaire
  await db.team.update({
    where: { id: match.homeTeamId },
    data: {
      wins: homeStats.wins,
      draws: homeStats.draws,
      losses: homeStats.losses,
      goalsFor: homeStats.goalsFor,
      goalsAgainst: homeStats.goalsAgainst,
    },
  })

  await db.team.update({
    where: { id: match.awayTeamId },
    data: {
      wins: awayStats.wins,
      draws: awayStats.draws,
      losses: awayStats.losses,
      goalsFor: awayStats.goalsFor,
      goalsAgainst: awayStats.goalsAgainst,
    },
  })

  // Récupérer les données d'enrichissement si disponibles
  const enrichment = await db.matchEnrichment.findUnique({
    where: { matchId: match.id },
  })

  let enrichmentData: any = null
  if (enrichment) {
    try {
      enrichmentData = {
        injuries: {
          home: enrichment.homeInjuries ? JSON.parse(enrichment.homeInjuries) : [],
          away: enrichment.awayInjuries ? JSON.parse(enrichment.awayInjuries) : [],
        },
        lineups: {
          home: enrichment.homeLineup ? JSON.parse(enrichment.homeLineup) : null,
          away: enrichment.awayLineup ? JSON.parse(enrichment.awayLineup) : null,
        },
        weather: enrichment.weather ? JSON.parse(enrichment.weather) : null,
      }
    } catch (error) {
      console.error("Erreur parsing enrichment:", error)
    }
  }

  // Générer la prédiction avec l'IA (avec toutes les métriques avancées + enrichissement)
  const aiPrediction = await generatePrediction({
    homeTeam: {
      ...match.homeTeam,
      wins: homeStats.wins,
      draws: homeStats.draws,
      losses: homeStats.losses,
      goalsFor: homeStats.goalsFor,
      goalsAgainst: homeStats.goalsAgainst,
    },
    awayTeam: {
      ...match.awayTeam,
      wins: awayStats.wins,
      draws: awayStats.draws,
      losses: awayStats.losses,
      goalsFor: awayStats.goalsFor,
      goalsAgainst: awayStats.goalsAgainst,
    },
    match: {
      id: match.id,
      home: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        logo: match.homeTeam.logo || "⚽",
        wins: homeStats.wins,
        draws: homeStats.draws,
        losses: homeStats.losses,
        goalsFor: homeStats.goalsFor,
        goalsAgainst: homeStats.goalsAgainst,
      },
      away: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        logo: match.awayTeam.logo || "⚽",
        wins: awayStats.wins,
        draws: awayStats.draws,
        losses: awayStats.losses,
        goalsFor: awayStats.goalsFor,
        goalsAgainst: awayStats.goalsAgainst,
      },
      date: match.date.toISOString().split("T")[0],
      league: match.league,
      leagueId: match.leagueId || "",
      hour: match.hour || "",
    },
    homeForm,
    awayForm,
    homeRecentGoals: homeStats.recentGoalsFor || homeStats.goalsFor,
    awayRecentGoals: awayStats.recentGoalsFor || awayStats.goalsFor,
    homeRecentConceded: homeStats.recentGoalsAgainst || homeStats.goalsAgainst,
    awayRecentConceded: awayStats.recentGoalsAgainst || awayStats.goalsAgainst,
    // Nouvelles métriques avancées
    homeAdvancedStats: {
      homeStats: homeStats.homeStats,
      awayStats: homeStats.awayStats,
      trends: homeStats.trends,
      performance: homeStats.performance,
      recentPoints: homeStats.recentPoints,
      recentGoalsFor: homeStats.recentGoalsFor,
      recentGoalsAgainst: homeStats.recentGoalsAgainst,
    },
    awayAdvancedStats: {
      homeStats: awayStats.homeStats,
      awayStats: awayStats.awayStats,
      trends: awayStats.trends,
      performance: awayStats.performance,
      recentPoints: awayStats.recentPoints,
      recentGoalsFor: awayStats.recentGoalsFor,
      recentGoalsAgainst: awayStats.recentGoalsAgainst,
    },
  })

  // Convertir en format base de données (gérer les double chances)
  const pred = aiPrediction.prediction_1n2
  const confidence = aiPrediction.confidence_1n2 / 100
  
  let win1 = 0.33
  let draw = 0.33
  let win2 = 0.33
  
  if (pred === "1") {
    win1 = confidence
    draw = (1 - confidence) * 0.5
    win2 = (1 - confidence) * 0.5
  } else if (pred === "X") {
    draw = confidence
    win1 = (1 - confidence) * 0.5
    win2 = (1 - confidence) * 0.5
  } else if (pred === "2") {
    win2 = confidence
    win1 = (1 - confidence) * 0.5
    draw = (1 - confidence) * 0.5
  } else if (pred === "1X") {
    // Victoire domicile ou nul
    win1 = confidence * 0.6
    draw = confidence * 0.4
    win2 = 1 - confidence
  } else if (pred === "X2") {
    // Nul ou victoire extérieure
    draw = confidence * 0.4
    win2 = confidence * 0.6
    win1 = 1 - confidence
  } else if (pred === "12") {
    // Victoire domicile ou extérieure (pas de nul)
    win1 = confidence * 0.5
    win2 = confidence * 0.5
    draw = 1 - confidence
  }

  // Normaliser les probabilités
  const total = win1 + draw + win2
  const normalizedWin1 = win1 / total
  const normalizedDraw = draw / total
  const normalizedWin2 = win2 / total

  // Sauvegarder ou mettre à jour la prédiction
  const prediction = await db.prediction.upsert({
    where: { matchId },
    create: {
      matchId,
      win1: normalizedWin1,
      draw: normalizedDraw,
      win2: normalizedWin2,
      predictedScore: aiPrediction.predicted_score,
      scoreExact: JSON.stringify([
        { score: aiPrediction.predicted_score, probability: aiPrediction.confidence_score / 100 },
      ]),
      btts: aiPrediction.btts ? 0.7 : 0.3,
      over25: aiPrediction.over_under_2_5 === "OVER" ? aiPrediction.confidence_ou25 / 100 : 1 - aiPrediction.confidence_ou25 / 100,
      analysis: aiPrediction.analysis,
      confidence: aiPrediction.confidence_1n2 / 100,
    },
    update: {
      win1: normalizedWin1,
      draw: normalizedDraw,
      win2: normalizedWin2,
      predictedScore: aiPrediction.predicted_score,
      scoreExact: JSON.stringify([
        { score: aiPrediction.predicted_score, probability: aiPrediction.confidence_score / 100 },
      ]),
      btts: aiPrediction.btts ? 0.7 : 0.3,
      over25: aiPrediction.over_under_2_5 === "OVER" ? aiPrediction.confidence_ou25 / 100 : 1 - aiPrediction.confidence_ou25 / 100,
      analysis: aiPrediction.analysis,
      confidence: aiPrediction.confidence_1n2 / 100,
    },
  })

  return prediction
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get("matchId")

    if (matchId) {
      // Prédiction pour un match spécifique
      console.log(`🔮 Génération de prédiction pour le match ${matchId}`)
      const prediction = await generateMatchPrediction(parseInt(matchId, 10))

      // Déterminer la prédiction 1N2 (avec double chance si confiance faible)
      const { prediction_1n2, confidence_1n2 } = determinePrediction1N2(
        prediction.win1,
        prediction.draw,
        prediction.win2
      )

      // Calculer la confiance du score basée sur le nombre total de buts
      const scoreParts = prediction.predictedScore?.split("-") || ["1", "1"]
      const totalGoals = parseInt(scoreParts[0] || "1") + parseInt(scoreParts[1] || "1")
      const confidence_score = Math.max(35, Math.min(60, totalGoals * 8))

      return NextResponse.json({
        prediction: {
          prediction_1n2,
          confidence_1n2,
          predicted_score: prediction.predictedScore || "1-1",
          confidence_score,
          btts: prediction.btts > 0.5,
          confidence_btts: Math.round(prediction.btts * 100),
          over_under_2_5: prediction.over25 > 0.5 ? "OVER" : "UNDER",
          confidence_ou25: Math.round(prediction.over25 * 100),
          analysis: prediction.analysis || "Analyse non disponible",
        },
      })
    }

    // Prédictions pour tous les matchs à venir
    const upcomingMatches = await db.match.findMany({
      where: {
        date: {
          gte: new Date(),
        },
        status: "scheduled",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 20,
    })

    const predictions = await Promise.all(
      upcomingMatches.map(async (match) => {
        try {
          const prediction = await generateMatchPrediction(match.id)
          return {
            matchId: match.id,
            prediction: {
              ...determinePrediction1N2(prediction.win1, prediction.draw, prediction.win2),
              predicted_score: prediction.predictedScore || "1-1",
              confidence_score: 40,
              btts: prediction.btts > 0.5,
              confidence_btts: Math.round(prediction.btts * 100),
              over_under_2_5: prediction.over25 > 0.5 ? "OVER" : "UNDER",
              confidence_ou25: Math.round(prediction.over25 * 100),
              analysis: prediction.analysis,
            },
          }
        } catch (error) {
          console.error(`Erreur pour le match ${match.id}:`, error)
          return null
        }
      })
    )

    return NextResponse.json({
      predictions: predictions.filter((p) => p !== null),
    })
  } catch (error) {
    console.error("Erreur API predictions:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la génération des prédictions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId } = body

    if (!matchId) {
      return NextResponse.json({ error: "matchId requis" }, { status: 400 })
    }

    const prediction = await generateMatchPrediction(matchId)

    return NextResponse.json({
      success: true,
      prediction: {
        prediction_1n2: prediction.win1 > prediction.draw && prediction.win1 > prediction.win2 ? "1" : prediction.win2 > prediction.draw ? "2" : "X",
        confidence_1n2: Math.round(Math.max(prediction.win1, prediction.draw, prediction.win2) * 100),
        predicted_score: prediction.predictedScore || "1-1",
        confidence_score: 40,
        btts: prediction.btts > 0.5,
        confidence_btts: Math.round(prediction.btts * 100),
        over_under_2_5: prediction.over25 > 0.5 ? "OVER" : "UNDER",
        confidence_ou25: Math.round(prediction.over25 * 100),
        analysis: prediction.analysis,
      },
    })
  } catch (error) {
    console.error("Erreur API predictions POST:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la génération de la prédiction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
