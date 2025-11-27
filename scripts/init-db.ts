/**
 * Script pour initialiser la base de données PostgreSQL
 * À exécuter après avoir configuré Neon/Supabase sur Vercel
 */

import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"

const prisma = new PrismaClient()

async function main() {
  console.log("🔄 Initialisation de la base de données...")
  
  try {
    // Push le schema Prisma pour créer les tables
    console.log("📊 Création des tables...")
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" })
    
    console.log("✅ Base de données initialisée avec succès!")
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

