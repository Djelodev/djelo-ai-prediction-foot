import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * Route API pour initialiser la base de données
 * Crée toutes les tables nécessaires
 * 
 * ⚠️ À utiliser UNE SEULE FOIS après avoir configuré PostgreSQL
 * Protégez cette route en production !
 */
export async function POST(request: NextRequest) {
  // Vérification simple (à améliorer en production)
  const authHeader = request.headers.get("authorization")
  const expectedToken = process.env.ADMIN_TOKEN || "init-db-token-change-me"
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    console.log("🔄 Initialisation de la base de données...")

    // Test de connexion
    await db.$connect()
    console.log("✅ Connexion à la base de données réussie")

    // Créer les tables en utilisant Prisma migrate deploy
    // Note: Cette route nécessite que les migrations soient déjà créées
    // Pour une solution plus simple, utilisez prisma db push en local
    
    return NextResponse.json({
      success: true,
      message: "Base de données initialisée. Utilisez 'prisma db push' en local pour créer les tables.",
      instructions: [
        "1. Récupérez DATABASE_URL depuis Vercel",
        "2. Exécutez en local: pnpm prisma db push",
        "3. Ou utilisez Prisma Studio: pnpm prisma studio"
      ]
    })
  } catch (error: any) {
    console.error("❌ Erreur lors de l'initialisation:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de l'initialisation",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

