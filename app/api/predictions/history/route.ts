import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateShortName } from "@/lib/team-utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startRange = new Date(startToday)
    startRange.setDate(startRange.getDate() - 3)

    const matches = await db.match.findMany({
      where: {
        date: {
          gte: startRange,
          lt: startToday,
        },
        prediction: {
          isNot: null,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        prediction: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    const formatted = matches
      .filter((match) => match.prediction !== null)
      .map((match) => {
        const dateKey = new Date(match.date)
        const dayLabel = new Date(
          dateKey.getFullYear(),
          dateKey.getMonth(),
          dateKey.getDate()
        )
          .toISOString()
          .split("T")[0]

        const formattedPrediction = match.prediction
          ? formatPredictionFromDB(
              match.prediction.win1,
              match.prediction.draw,
              match.prediction.win2,
              match.prediction.predictedScore,
              match.prediction.btts,
              match.prediction.over25,
              match.prediction.analysis
            )
          : null

        return {
          id: match.id,
          dateKey: dayLabel,
          timestamp: match.date.toISOString(),
          league: match.league,
          homeTeam: match.homeTeam.name,
          homeShortName: match.homeTeam.shortName || generateShortName(match.homeTeam.name),
          homeLogo: match.homeTeam.logo,
          awayTeam: match.awayTeam.name,
          awayShortName: match.awayTeam.shortName || generateShortName(match.awayTeam.name),
          awayLogo: match.awayTeam.logo,
          prediction: formattedPrediction,
        }
      })

    const grouped = formatted.reduce<Record<string, typeof formatted>>((acc, match) => {
      if (!acc[match.dateKey]) {
        acc[match.dateKey] = []
      }
      acc[match.dateKey].push(match)
      return acc
    }, {})

    const days = Object.entries(grouped)
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([date, matches]) => ({
        date,
        matches: matches.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1)),
      }))

    return NextResponse.json({
      days,
    })
  } catch (error) {
    console.error("Erreur historique predictions:", error)
    return NextResponse.json(
      {
        error: "Impossible de charger les pronostics récents",
      },
      { status: 500 }
    )
  }
}

function formatPredictionFromDB(
  win1: number,
  draw: number,
  win2: number,
  predictedScore: string | null,
  btts: number,
  over25: number,
  analysis: string | null
) {
  const maxProb = Math.max(win1, draw, win2)
  const confidence = Math.round(maxProb * 100)

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
    confidence_score: confidence_1n2,
    btts: btts > 0.5,
    confidence_btts: Math.round(btts * 100),
    over_under_2_5: over25 > 0.5 ? "OVER" : "UNDER",
    confidence_ou25: Math.round(over25 * 100),
    analysis: analysis || "Analyse indisponible",
  }
}

