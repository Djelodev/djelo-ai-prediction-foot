/**
 * Utilitaire pour afficher l'utilisation des APIs
 */

import { getRateLimitUsage } from "./rate-limiter"

export async function getApiUsageStats() {
  const footballDataUsageMinute = await getRateLimitUsage("football-data", "minute")
  const groqUsage = await getRateLimitUsage("groq", "day")

  return {
    footballData: {
      used: footballDataUsageMinute,
      limit: 10,
      remaining: 10 - footballDataUsageMinute,
      percentage: Math.round((footballDataUsageMinute / 10) * 100),
      type: "minute",
      resetIn: "prochaine minute",
    },
    groq: {
      used: groqUsage,
      limit: 100,
      remaining: 100 - groqUsage,
      percentage: Math.round((groqUsage / 100) * 100),
      type: "day",
      resetIn: "minuit",
    },
  }
}

