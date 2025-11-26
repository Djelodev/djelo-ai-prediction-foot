/**
 * Endpoint pour vérifier l'utilisation des APIs
 * GET /api/usage
 */

import { NextResponse } from "next/server"
import { getApiUsageStats } from "@/lib/api-usage"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = await getApiUsageStats()

    return NextResponse.json({
      success: true,
      stats,
      warnings: [
        stats.footballData.remaining < 3 && "⚠️ Moins de 3 requêtes Football-Data restantes cette minute",
        stats.groq.remaining < 10 && "⚠️ Moins de 10 requêtes Groq restantes aujourd'hui",
      ].filter(Boolean),
    })
  } catch (error) {
    console.error("Erreur API usage:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'utilisation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

