/**
 * Endpoint API pour synchroniser les matchs depuis l'API Football
 * GET /api/sync?days=7
 */

import { NextRequest, NextResponse } from "next/server"
import { syncMatchesFromAPI, syncPastMatchesAndUpdateStats } from "@/lib/match-sync"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get("days") || "7", 10)
    const syncPast = searchParams.get("syncPast") !== "false" // Par défaut, synchroniser les matchs passés

    console.log(`🔄 Début synchronisation pour ${days} jours`)

    // Synchroniser les matchs passés d'abord pour avoir les stats (une seule fois par jour)
    let pastCount = 0
    if (syncPast) {
      console.log("📊 Synchronisation des matchs passés pour calculer les stats...")
      try {
        pastCount = await syncPastMatchesAndUpdateStats(30) // 30 derniers jours
      } catch (error) {
        console.error("⚠️ Erreur lors de la synchronisation des matchs passés:", error)
        // Continuer même si ça échoue
      }
    }

    // Ensuite synchroniser les matchs à venir
    const syncedCount = await syncMatchesFromAPI(days)

    if (syncedCount === 0 && pastCount === 0) {
      return NextResponse.json({
        success: false,
        message: "Aucun match synchronisé. Vérifiez votre clé API et qu'il y a des matchs programmés.",
        count: 0,
        warning: "Vérifiez que FOOTBALL_DATA_API_TOKEN est configurée dans .env (optionnel pour le plan gratuit)",
      })
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount} matchs à venir et ${pastCount} matchs passés synchronisés`,
      upcomingCount: syncedCount,
      pastCount: pastCount,
      total: syncedCount + pastCount,
    })
  } catch (error) {
    console.error("Erreur API sync:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la synchronisation",
        details: errorMessage,
        hint: "Vérifiez les logs du serveur pour plus de détails",
      },
      { status: 500 }
    )
  }
}

