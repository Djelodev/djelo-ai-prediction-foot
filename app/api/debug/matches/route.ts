/**
 * Endpoint de debug pour voir les matchs en base
 * GET /api/debug/matches
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const now = new Date()
    
    // Tous les matchs
    const allMatches = await db.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 100,
    })

    // Matchs à venir
    const upcomingMatches = await db.match.findMany({
      where: {
        date: {
          gte: now,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 100,
    })

    // Matchs avec status scheduled
    const scheduledMatches = await db.match.findMany({
      where: {
        date: {
          gte: now,
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
      take: 100,
    })

    // Statistiques
    const statusCounts = await db.match.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      debug: {
        totalMatches: allMatches.length,
        upcomingMatches: upcomingMatches.length,
        scheduledMatches: scheduledMatches.length,
        statusCounts: statusCounts,
        now: now.toISOString(),
      },
      allMatches: allMatches.map((m) => ({
        id: m.id,
        apiId: m.apiId,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        league: m.league,
        date: m.date.toISOString(),
        status: m.status,
      })),
      upcomingMatches: upcomingMatches.map((m) => ({
        id: m.id,
        apiId: m.apiId,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        league: m.league,
        date: m.date.toISOString(),
        status: m.status,
      })),
      scheduledMatches: scheduledMatches.map((m) => ({
        id: m.id,
        apiId: m.apiId,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        league: m.league,
        date: m.date.toISOString(),
        status: m.status,
      })),
    })
  } catch (error) {
    console.error("Erreur debug matches:", error)
    return NextResponse.json(
      {
        error: "Erreur lors du debug",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

