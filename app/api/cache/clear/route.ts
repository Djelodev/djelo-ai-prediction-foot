/**
 * Endpoint pour vider le cache
 * GET /api/cache/clear
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Supprimer tous les caches
    const deleted = await db.cache.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `Cache vidé: ${deleted.count} entrées supprimées`,
      count: deleted.count,
    })
  } catch (error) {
    console.error("Erreur lors du vidage du cache:", error)
    return NextResponse.json(
      {
        error: "Erreur lors du vidage du cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

