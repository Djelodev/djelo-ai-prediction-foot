const KNOWN_SHORT_NAMES: Record<string, string> = {
  "paris saint-germain": "PSG",
  "paris saint germain": "PSG",
  "fc barcelone": "BARCELONE",
  "fc barcelona": "BARCELONA",
  "manchester united": "MANCHESTER",
  "manchester city": "MANCHESTER",
  "tottenham hotspur": "SPURS",
  "atletico madrid": "ATLÉTICO",
  "real sociedad": "SOCIEDAD",
  "real betis balompié": "BETIS",
  "real betis balompie": "BETIS",
  "borussia dortmund": "DORTMUND",
  "borussia mönchengladbach": "GLADBACH",
  "borussia monchengladbach": "GLADBACH",
  "newcastle united": "NEWCASTLE",
  "nottingham forest": "FOREST",
  "bayer leverkusen": "LEVERKUSEN",
  "rb leipzig": "LEIPZIG",
  "west ham united": "WEST HAM",
  "crystal palace": "PALACE",
  "athletic club": "ATHLETIC",
  "brighton & hove albion": "BRIGHTON",
  "brighton and hove albion": "BRIGHTON",
  "hellas verona": "VERONA",
}

const STOP_WORDS = new Set([
  "fc",
  "cf",
  "ac",
  "sc",
  "club",
  "de",
  "la",
  "el",
  "los",
  "las",
  "sporting",
  "real",
  "atletico",
  "athletic",
  "sociedad",
  "calcio",
  "united",
  "city",
  "hotspur",
])

export function generateShortName(name: string): string {
  if (!name) return ""
  const normalized = name.trim()
  const lower = normalized.toLowerCase()

  if (normalized.length <= 8) {
    return normalized
  }

  if (KNOWN_SHORT_NAMES[lower]) {
    return KNOWN_SHORT_NAMES[lower]
  }

  const tokens = normalized.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) {
    return normalized.slice(0, 8)
  }

  const filtered = tokens.filter((token) => !STOP_WORDS.has(token.toLowerCase()))
  const candidates = filtered.length ? filtered : tokens

  const preferLast = candidates[candidates.length - 1]
  if (preferLast) {
    return preferLast
  }

  return candidates[0]
}

