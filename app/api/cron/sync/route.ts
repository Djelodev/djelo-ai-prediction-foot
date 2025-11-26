/**
 * Endpoint CRON pour synchroniser automatiquement les matchs
 * À appeler via un service de cron (Vercel Cron, GitHub Actions, etc.)
 * 
 * Protection: Utiliser un secret dans les headers pour sécuriser l'endpoint
 * Exemple: Authorization: Bearer YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server"
import { syncMatchesFromAPI, syncPastMatchesAndUpdateStats } from "@/lib/match-sync"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret CRON (optionnel mais recommandé)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log(`🔄 [CRON] Début synchronisation automatique`)

    // Synchroniser les matchs passés pour les stats (30 derniers jours)
    let pastCount = 0
    try {
      pastCount = await syncPastMatchesAndUpdateStats(30)
      console.log(`✅ [CRON] ${pastCount} matchs passés synchronisés`)
    } catch (error) {
      console.error("⚠️ [CRON] Erreur synchronisation matchs passés:", error)
    }

    // Synchroniser les matchs à venir (7 prochains jours)
    const upcomingCount = await syncMatchesFromAPI(7)
    console.log(`✅ [CRON] ${upcomingCount} matchs à venir synchronisés`)

    return NextResponse.json({
      success: true,
      message: "Synchronisation automatique terminée",
      upcomingCount,
      pastCount,
      total: upcomingCount + pastCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [CRON] Erreur synchronisation:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la synchronisation automatique",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

