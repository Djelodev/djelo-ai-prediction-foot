export interface Team {
  id: number
  name: string
  logo: string
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

export interface Match {
  id: number
  home: Team
  away: Team
  date: string
  league: string
  leagueId: string
  hour: string
}

export interface Prediction {
  matchId: number
  win1: number
  draw: number
  win2: number
  scoreExact: {
    score: string
    probability: number
  }[]
  btts: number
  over25: number
  analysis: string
  confidence: number
}

export interface LeagueFilter {
  id: string
  name: string
  country: string
  selected: boolean
}
