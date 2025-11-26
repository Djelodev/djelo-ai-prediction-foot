/**
 * Système de cache simple en mémoire + base de données
 * Pour optimiser les performances et réduire les appels API
 */

import { db } from "./db"

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

// Cache en mémoire pour les accès rapides
const memoryCache = new Map<string, CacheEntry<unknown>>()

const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS || "6", 10)
const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000

/**
 * Récupère une valeur du cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  // Vérifier le cache mémoire d'abord
  const memoryEntry = memoryCache.get(key)
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry.value as T
  }

  // Nettoyer le cache mémoire expiré
  if (memoryEntry && memoryEntry.expiresAt <= Date.now()) {
    memoryCache.delete(key)
  }

  // Vérifier la base de données
  try {
    const dbEntry = await db.cache.findUnique({
      where: { key },
    })

    if (dbEntry && new Date(dbEntry.expiresAt).getTime() > Date.now()) {
      const value = JSON.parse(dbEntry.value) as T
      
      // Mettre à jour le cache mémoire
      memoryCache.set(key, {
        value,
        expiresAt: new Date(dbEntry.expiresAt).getTime(),
      })

      return value
    }

    // Supprimer l'entrée expirée
    if (dbEntry) {
      await db.cache.delete({
        where: { key },
      })
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du cache:", error)
  }

  return null
}

/**
 * Stocke une valeur dans le cache
 */
export async function setCache<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  const expiresAt = Date.now() + (ttlMs || CACHE_TTL_MS)

  // Mettre à jour le cache mémoire
  memoryCache.set(key, {
    value,
    expiresAt,
  })

  // Mettre à jour la base de données
  try {
    await db.cache.upsert({
      where: { key },
      create: {
        key,
        value: JSON.stringify(value),
        expiresAt: new Date(expiresAt),
      },
      update: {
        value: JSON.stringify(value),
        expiresAt: new Date(expiresAt),
      },
    })
  } catch (error) {
    console.error("Erreur lors de la mise en cache:", error)
  }
}

/**
 * Supprime une entrée du cache
 */
export async function deleteCache(key: string): Promise<void> {
  memoryCache.delete(key)
  
  try {
    await db.cache.delete({
      where: { key },
    }).catch(() => {
      // Ignorer si l'entrée n'existe pas
    })
  } catch (error) {
    console.error("Erreur lors de la suppression du cache:", error)
  }
}

/**
 * Nettoie les entrées expirées du cache
 */
export async function cleanExpiredCache(): Promise<void> {
  const now = new Date()

  // Nettoyer la mémoire
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= Date.now()) {
      memoryCache.delete(key)
    }
  }

  // Nettoyer la base de données
  try {
    await db.cache.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    })
  } catch (error) {
    console.error("Erreur lors du nettoyage du cache:", error)
  }
}

/**
 * Wrapper pour exécuter une fonction avec cache
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  // Essayer de récupérer du cache
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Exécuter la fonction
  const result = await fn()

  // Mettre en cache
  await setCache(key, result, ttlMs)

  return result
}

