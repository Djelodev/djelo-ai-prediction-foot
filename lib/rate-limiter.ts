/**
 * Système de rate limiting pour respecter les quotas des APIs gratuites
 * Supporte les limites par minute et par jour
 */

import { db } from "./db"

// Cache en mémoire pour les vérifications rapides
const memoryRateLimit = new Map<string, { count: number; resetAt: number; type: "minute" | "day" }>()

/**
 * Vérifie et incrémente le compteur de requêtes pour une API
 * @param apiName Nom de l'API (ex: "football-data", "groq")
 * @param limit Limite (par minute ou par jour selon le type)
 * @param type Type de limite: "minute" ou "day"
 * @returns true si la requête est autorisée, false sinon
 */
export async function checkRateLimit(
  apiName: string,
  limit: number,
  type: "minute" | "day" = "day"
): Promise<boolean> {
  const now = Date.now()
  let key: string
  let resetAt: number

  if (type === "minute") {
    // Limite par minute : clé basée sur l'heure et la minute
    const minuteKey = Math.floor(now / (60 * 1000)) // Timestamp arrondi à la minute
    key = `${apiName}-minute-${minuteKey}`
    resetAt = (minuteKey + 1) * 60 * 1000 // Prochaine minute
  } else {
    // Limite par jour : clé basée sur la date
    const today = new Date().toISOString().split("T")[0]
    key = `${apiName}-day-${today}`
    const resetDate = new Date()
    resetDate.setHours(24, 0, 0, 0) // Minuit prochain
    resetAt = resetDate.getTime()
  }

  // Vérifier le cache mémoire
  const memoryEntry = memoryRateLimit.get(key)
  if (memoryEntry) {
    if (now < memoryEntry.resetAt) {
      if (memoryEntry.count >= limit) {
        return false
      }
      memoryEntry.count++
      return true
    } else {
      // Expiré, réinitialiser
      memoryRateLimit.delete(key)
    }
  }

  try {
    // Utiliser le cache de Prisma comme table de rate limiting
    const cacheEntry = await db.cache.findUnique({
      where: { key },
    })

    if (cacheEntry && new Date(cacheEntry.expiresAt).getTime() > now) {
      const data = JSON.parse(cacheEntry.value) as { count: number }
      if (data.count >= limit) {
        return false
      }

      // Incrémenter
      await db.cache.update({
        where: { key },
        data: {
          value: JSON.stringify({ count: data.count + 1 }),
        },
      })

      // Mettre à jour le cache mémoire
      memoryRateLimit.set(key, {
        count: data.count + 1,
        resetAt,
        type,
      })

      return true
    }

    // Créer une nouvelle entrée
    await db.cache.upsert({
      where: { key },
      create: {
        key,
        value: JSON.stringify({ count: 1 }),
        expiresAt: new Date(resetAt),
      },
      update: {
        value: JSON.stringify({ count: 1 }),
        expiresAt: new Date(resetAt),
      },
    })

    memoryRateLimit.set(key, {
      count: 1,
      resetAt,
      type,
    })

    return true
  } catch (error) {
    console.error("Erreur rate limiter:", error)
    // En cas d'erreur, autoriser la requête (fail open)
    return true
  }
}

/**
 * Récupère le nombre de requêtes utilisées
 */
export async function getRateLimitUsage(apiName: string, type: "minute" | "day" = "day"): Promise<number> {
  const now = Date.now()
  let key: string

  if (type === "minute") {
    const minuteKey = Math.floor(now / (60 * 1000))
    key = `${apiName}-minute-${minuteKey}`
  } else {
    const today = new Date().toISOString().split("T")[0]
    key = `${apiName}-day-${today}`
  }

  const memoryEntry = memoryRateLimit.get(key)
  if (memoryEntry && now < memoryEntry.resetAt) {
    return memoryEntry.count
  }

  try {
    const cacheEntry = await db.cache.findUnique({
      where: { key },
    })

    if (cacheEntry && new Date(cacheEntry.expiresAt).getTime() > now) {
      const data = JSON.parse(cacheEntry.value) as { count: number }
      return data.count
    }
  } catch (error) {
    console.error("Erreur récupération usage:", error)
  }

  return 0
}
