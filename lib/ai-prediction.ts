/**
 * Service amélioré de prédiction IA
 * Utilise Groq (gratuit) avec un prompt sophistiqué
 * 
 * OPTIMISATIONS:
 * - Rate limiting pour respecter les limites Groq
 * - Cache des prédictions (6h)
 * - Fallback si rate limit atteint
 */

import { generateText } from "ai"
import { checkRateLimit } from "./rate-limiter"
import type { Team, Match } from "./types"

// Groq free tier: ~30 req/min, pas de limite quotidienne stricte mais on limite à 100/jour par sécurité
const GROQ_DAILY_LIMIT = 100

interface AdvancedStats {
  homeStats: {
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    matches: number
  }
  awayStats: {
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    matches: number
  }
  trends: {
    points: number
    goalsFor: number
    goalsAgainst: number
    improving: boolean
    declining: boolean
  }
  performance: {
    narrowWins: number
    largeWins: number
    narrowLosses: number
    largeLosses: number
    winQuality: number
    avgGoalsFor: number
    avgGoalsAgainst: number
  }
  recentPoints: number
  recentGoalsFor: number
  recentGoalsAgainst: number
}

interface MatchEnrichment {
  injuries?: {
    home: Array<{ player: { name: string }; type: string; reason: string }>
    away: Array<{ player: { name: string }; type: string; reason: string }>
  }
  lineups?: {
    home: { formation: string; coach: { name: string }; startXI: Array<{ player: { name: string; pos: string } }> } | null
    away: { formation: string; coach: { name: string }; startXI: Array<{ player: { name: string; pos: string } }> } | null
  }
  weather?: {
    main: { temp: number; feels_like: number; humidity: number }
    weather: Array<{ main: string; description: string }>
    wind: { speed: number }
    visibility: number
  }
  headToHead?: Array<{
    teams: { home: { name: string }; away: { name: string } }
    goals: { home: number | null; away: number | null }
    score: { fulltime: { home: number | null; away: number | null } }
  }>
  statistics?: {
    home: { statistics: Array<{ type: string; value: number | string | null }> } | null
    away: { statistics: Array<{ type: string; value: number | string | null }> } | null
  }
}

interface MatchStats {
  homeTeam: Team
  awayTeam: Team
  match: Match
  homeForm: string
  awayForm: string
  homeRecentGoals: number
  awayRecentGoals: number
  homeRecentConceded: number
  awayRecentConceded: number
  homeAdvancedStats?: AdvancedStats
  awayAdvancedStats?: AdvancedStats
  enrichment?: MatchEnrichment
}

interface PredictionResult {
  prediction_1n2: "1" | "X" | "2" | "1X" | "X2" | "12"
  confidence_1n2: number
  predicted_score: string
  confidence_score: number
  btts: boolean
  confidence_btts: number
  over_under_2_5: "OVER" | "UNDER"
  confidence_ou25: number
  analysis: string
}

/**
 * Calcule les statistiques de base pour la prédiction
 */
function calculateBasicStats(stats: MatchStats) {
  const home = stats.homeTeam
  const away = stats.awayTeam

  // Calculs de base
  const homeGoalsAvg = home.goalsFor / (home.wins + home.draws + home.losses || 1)
  const awayGoalsAvg = away.goalsFor / (away.wins + away.draws + away.losses || 1)
  const homeConcededAvg = home.goalsAgainst / (home.wins + home.draws + home.losses || 1)
  const awayConcededAvg = away.goalsAgainst / (away.wins + away.draws + away.losses || 1)

  // Probabilités de base
  const homeExpectedGoals = (homeGoalsAvg + awayConcededAvg) / 2
  const awayExpectedGoals = (awayGoalsAvg + homeConcededAvg) / 2

  // Probabilité 1N2 basique
  const homeWinProb = homeExpectedGoals > awayExpectedGoals ? 0.4 + (homeExpectedGoals - awayExpectedGoals) * 0.1 : 0.3
  const awayWinProb = awayExpectedGoals > homeExpectedGoals ? 0.4 + (awayExpectedGoals - homeExpectedGoals) * 0.1 : 0.3
  const drawProb = 1 - homeWinProb - awayWinProb

  // BTTS probabilité
  const bttsProb = Math.min(0.9, (homeGoalsAvg + awayGoalsAvg) / 3)

  // Over 2.5 probabilité
  const totalExpected = homeExpectedGoals + awayExpectedGoals
  const over25Prob = Math.min(0.9, totalExpected / 3)

  return {
    homeExpectedGoals,
    awayExpectedGoals,
    homeWinProb,
    drawProb,
    awayWinProb,
    bttsProb,
    over25Prob,
  }
}

/**
 * Génère une prédiction avec l'IA
 */
export async function generatePrediction(stats: MatchStats): Promise<PredictionResult> {
  const basicStats = calculateBasicStats(stats)

  // Calculs avancés pour l'analyse experte
  const totalMatchesHome = stats.homeTeam.wins + stats.homeTeam.draws + stats.homeTeam.losses || 1
  const totalMatchesAway = stats.awayTeam.wins + stats.awayTeam.draws + stats.awayTeam.losses || 1
  
  const homeAvgGoals = (stats.homeTeam.goalsFor / totalMatchesHome).toFixed(2)
  const awayAvgGoals = (stats.awayTeam.goalsFor / totalMatchesAway).toFixed(2)
  const homeAvgConceded = (stats.homeTeam.goalsAgainst / totalMatchesHome).toFixed(2)
  const awayAvgConceded = (stats.awayTeam.goalsAgainst / totalMatchesAway).toFixed(2)
  
  const homeGoalDiff = stats.homeTeam.goalsFor - stats.homeTeam.goalsAgainst
  const awayGoalDiff = stats.awayTeam.goalsFor - stats.awayTeam.goalsAgainst
  
  // Efficacité offensive (buts marqués par match)
  const homeOffensiveEfficiency = parseFloat(homeAvgGoals)
  const awayOffensiveEfficiency = parseFloat(awayAvgGoals)
  
  // Efficacité défensive (buts encaissés par match)
  const homeDefensiveEfficiency = parseFloat(homeAvgConceded)
  const awayDefensiveEfficiency = parseFloat(awayAvgConceded)
  
  // Ratio buts marqués/encaissés (indicateur d'équilibre)
  const homeBalance = totalMatchesHome > 0 ? (stats.homeTeam.goalsFor / Math.max(1, stats.homeTeam.goalsAgainst)).toFixed(2) : "1.00"
  const awayBalance = totalMatchesAway > 0 ? (stats.awayTeam.goalsFor / Math.max(1, stats.awayTeam.goalsAgainst)).toFixed(2) : "1.00"
  
  // Taux de victoires (indicateur de régularité)
  const homeWinRate = ((stats.homeTeam.wins / totalMatchesHome) * 100).toFixed(1)
  const awayWinRate = ((stats.awayTeam.wins / totalMatchesAway) * 100).toFixed(1)
  
  // Taux de nuls (indicateur de fermeture défensive ou manque de finition)
  const homeDrawRate = ((stats.homeTeam.draws / totalMatchesHome) * 100).toFixed(1)
  const awayDrawRate = ((stats.awayTeam.draws / totalMatchesAway) * 100).toFixed(1)
  
  // Métriques avancées (si disponibles)
  const homeAdv = stats.homeAdvancedStats
  const awayAdv = stats.awayAdvancedStats
  
  // Stats domicile vs extérieur
  const homeHomeStats = homeAdv?.homeStats
  const homeAwayStats = homeAdv?.awayStats
  const awayHomeStats = awayAdv?.homeStats
  const awayAwayStats = awayAdv?.awayStats
  
  // Tendances
  const homeTrends = homeAdv?.trends
  const awayTrends = awayAdv?.trends
  
  // Performance (surperformance, qualité des victoires)
  const homePerf = homeAdv?.performance
  const awayPerf = awayAdv?.performance
  
  const prompt = `Tu es un modèle d'analyse avancée du football dont le but est d'évaluer la probabilité des issues d'un match de manière objective, contextuelle, et non suiveuse.

⚠️ RÈGLE ABSOLUE DE COHÉRENCE : Le score exact DOIT être cohérent avec la prédiction 1N2 :
- Si prediction_1n2 = "1" → Score type "2-1", "3-0", "2-0" (domicile > extérieur)
- Si prediction_1n2 = "X" → Score type "1-1", "2-2", "0-0" (égalité)
- Si prediction_1n2 = "2" → Score type "1-2", "0-2", "1-3" (extérieur > domicile)
- Si prediction_1n2 = "1X" → Score type "1-1", "2-1", "2-0" (domicile gagne OU nul, PAS de défaite domicile)
- Si prediction_1n2 = "X2" → Score type "1-1", "1-2", "0-2" (nul OU extérieur gagne, PAS de victoire domicile)
- Si prediction_1n2 = "12" → Score type "2-1", "1-2", "2-0", "0-2" (victoire domicile OU extérieur, PAS de nul)

⚠️ DOUBLE CHANCE : Si ta confiance est FAIBLE (< 50%), utilise une DOUBLE CHANCE au lieu d'une prédiction simple :
- Si tu hésites entre "1" et "X" → Utilise "1X" (victoire domicile ou nul)
- Si tu hésites entre "X" et "2" → Utilise "X2" (nul ou victoire extérieure)
- Si tu hésites entre "1" et "2" → Utilise "12" (victoire domicile ou extérieure, pas de nul)
- La double chance augmente la confiance car elle couvre 2 issues possibles

Tu ne dois JAMAIS te baser uniquement sur la réputation, le classement ou l'historique récent pour tirer une conclusion.
Tu dois DÉTECTER les signaux faibles, les anomalies et les éléments contextuels qui peuvent renverser les tendances apparentes.

═══════════════════════════════════════════════════════════════
MATCH: ${stats.match.league} - ${stats.match.date} ${stats.match.hour || ""}
${stats.homeTeam.name} (DOMICILE) vs ${stats.awayTeam.name} (EXTÉRIEUR)
═══════════════════════════════════════════════════════════════

📊 DONNÉES DE PERFORMANCE RÉELLES - ${stats.homeTeam.name}:
- Bilan global: ${stats.homeTeam.wins}V-${stats.homeTeam.draws}N-${stats.homeTeam.losses}D (${totalMatchesHome} matchs)
- Buts: ${stats.homeTeam.goalsFor} marqués / ${stats.homeTeam.goalsAgainst} encaissés
- Différence: ${homeGoalDiff > 0 ? '+' : ''}${homeGoalDiff}
- Efficacité offensive: ${homeAvgGoals} buts/match
- Efficacité défensive: ${homeAvgConceded} buts/match
- Ratio attaque/défense: ${homeBalance} (${parseFloat(homeBalance) > 1.5 ? 'Offensive' : parseFloat(homeBalance) < 0.7 ? 'Défensive' : 'Équilibrée'})
- Taux victoires: ${homeWinRate}% | Taux nuls: ${homeDrawRate}%
- Forme récente (5 derniers): ${stats.homeForm}${homeAdv ? ` (${homeAdv.recentPoints} pts, ${homeAdv.recentGoalsFor} buts marqués, ${homeAdv.recentGoalsAgainst} encaissés)` : ''}
${homeHomeStats ? `- À DOMICILE: ${homeHomeStats.wins}V-${homeHomeStats.draws}N-${homeHomeStats.losses}D (${homeHomeStats.matches} matchs), ${homeHomeStats.goalsFor} buts marqués, ${homeHomeStats.goalsAgainst} encaissés` : ''}
${homeAwayStats ? `- À L'EXTÉRIEUR: ${homeAwayStats.wins}V-${homeAwayStats.draws}N-${homeAwayStats.losses}D (${homeAwayStats.matches} matchs), ${homeAwayStats.goalsFor} buts marqués, ${homeAwayStats.goalsAgainst} encaissés` : ''}
${homeTrends ? `- TENDANCES (10 derniers vs 10 précédents): ${homeTrends.improving ? '📈 AMÉLIORATION' : homeTrends.declining ? '📉 DÉGRADATION' : '➡️ STABLE'} (${homeTrends.points > 0 ? '+' : ''}${homeTrends.points} pts, ${homeTrends.goalsFor > 0 ? '+' : ''}${homeTrends.goalsFor} buts marqués, ${homeTrends.goalsAgainst > 0 ? '+' : ''}${homeTrends.goalsAgainst} buts encaissés)` : ''}
${homePerf ? `- QUALITÉ DES VICTOIRES: ${homePerf.largeWins} victoires larges (3+ buts), ${homePerf.narrowWins} victoires serrées (1 but) → ${(homePerf.winQuality * 100).toFixed(0)}% de victoires dominantes` : ''}

📊 DONNÉES DE PERFORMANCE RÉELLES - ${stats.awayTeam.name}:
- Bilan global: ${stats.awayTeam.wins}V-${stats.awayTeam.draws}N-${stats.awayTeam.losses}D (${totalMatchesAway} matchs)
- Buts: ${stats.awayTeam.goalsFor} marqués / ${stats.awayTeam.goalsAgainst} encaissés
- Différence: ${awayGoalDiff > 0 ? '+' : ''}${awayGoalDiff}
- Efficacité offensive: ${awayAvgGoals} buts/match
- Efficacité défensive: ${awayAvgConceded} buts/match
- Ratio attaque/défense: ${awayBalance} (${parseFloat(awayBalance) > 1.5 ? 'Offensive' : parseFloat(awayBalance) < 0.7 ? 'Défensive' : 'Équilibrée'})
- Taux victoires: ${awayWinRate}% | Taux nuls: ${awayDrawRate}%
- Forme récente (5 derniers): ${stats.awayForm}${awayAdv ? ` (${awayAdv.recentPoints} pts, ${awayAdv.recentGoalsFor} buts marqués, ${awayAdv.recentGoalsAgainst} encaissés)` : ''}
${awayHomeStats ? `- À DOMICILE: ${awayHomeStats.wins}V-${awayHomeStats.draws}N-${awayHomeStats.losses}D (${awayHomeStats.matches} matchs), ${awayHomeStats.goalsFor} buts marqués, ${awayHomeStats.goalsAgainst} encaissés` : ''}
${awayAwayStats ? `- À L'EXTÉRIEUR: ${awayAwayStats.wins}V-${awayAwayStats.draws}N-${awayAwayStats.losses}D (${awayAwayStats.matches} matchs), ${awayAwayStats.goalsFor} buts marqués, ${awayAwayStats.goalsAgainst} encaissés` : ''}
${awayTrends ? `- TENDANCES (10 derniers vs 10 précédents): ${awayTrends.improving ? '📈 AMÉLIORATION' : awayTrends.declining ? '📉 DÉGRADATION' : '➡️ STABLE'} (${awayTrends.points > 0 ? '+' : ''}${awayTrends.points} pts, ${awayTrends.goalsFor > 0 ? '+' : ''}${awayTrends.goalsFor} buts marqués, ${awayTrends.goalsAgainst > 0 ? '+' : ''}${awayTrends.goalsAgainst} buts encaissés)` : ''}
${awayPerf ? `- QUALITÉ DES VICTOIRES: ${awayPerf.largeWins} victoires larges (3+ buts), ${awayPerf.narrowWins} victoires serrées (1 but) → ${(awayPerf.winQuality * 100).toFixed(0)}% de victoires dominantes` : ''}

🎯 ANALYSE REQUISE - CATÉGORIES À EXAMINER:

1. **DONNÉES DE PERFORMANCE RÉELLES** (pas seulement les résultats):
   - Compare l'efficacité offensive vs défensive de chaque équipe
   - Analyse les ratios buts marqués/encaissés (équipe qui marque beaucoup mais encaisse aussi = défense fragile)
   - Détecte les incohérences: équipe avec beaucoup de buts marqués mais peu de victoires = problème de finition ou défense très faible
   - Taux de nuls élevé = équipe défensive solide OU manque de finition offensive
   - Volume de buts total = match ouvert (OVER) ou fermé (UNDER)

2. **CONTEXTE INTERNE DES ÉQUIPES** (inférences à partir des stats):
   ${homeTrends ? `- ${stats.homeTeam.name}: ${homeTrends.improving ? '📈 En amélioration' : homeTrends.declining ? '📉 En déclin' : '➡️ Stable'} (${homeTrends.points > 0 ? '+' : ''}${homeTrends.points} pts sur 10 derniers matchs). ${homeTrends.declining ? '⚠️ Signe de fragilité ou fatigue' : homeTrends.improving ? '✅ Dynamique positive' : ''}` : ''}
   ${awayTrends ? `- ${stats.awayTeam.name}: ${awayTrends.improving ? '📈 En amélioration' : awayTrends.declining ? '📉 En déclin' : '➡️ Stable'} (${awayTrends.points > 0 ? '+' : ''}${awayTrends.points} pts sur 10 derniers matchs). ${awayTrends.declining ? '⚠️ Signe de fragilité ou fatigue' : awayTrends.improving ? '✅ Dynamique positive' : ''}` : ''}
   ${homePerf ? `- ${stats.homeTeam.name}: ${homePerf.narrowWins > homePerf.largeWins ? '⚠️ Beaucoup de victoires serrées → Surperformance possible, risque de correction' : homePerf.largeWins > homePerf.narrowWins ? '✅ Victoires dominantes → Force réelle' : '➡️ Équilibre'}` : ''}
   ${awayPerf ? `- ${stats.awayTeam.name}: ${awayPerf.narrowWins > awayPerf.largeWins ? '⚠️ Beaucoup de victoires serrées → Surperformance possible, risque de correction' : awayPerf.largeWins > awayPerf.narrowWins ? '✅ Victoires dominantes → Force réelle' : '➡️ Équilibre'}` : ''}
   - Équipe avec ratio défensif excellent mais peu de victoires = manque d'efficacité offensive
   - Équipe qui encaisse beaucoup malgré un bon bilan = surperformance, risque de correction
   - Différence de buts négative mais bilan positif = victoires serrées, fragilité possible
   - Forme récente (${stats.homeForm} vs ${stats.awayForm}) vs moyenne générale = tendance à la hausse ou à la baisse

3. **ADAPTATION TACTIQUE AU MATCH SPÉCIFIQUE**:
   ${homeHomeStats && awayAwayStats ? `- Match-up DOMICILE vs EXTÉRIEUR: ${stats.homeTeam.name} à domicile (${homeHomeStats.wins}V-${homeHomeStats.draws}N-${homeHomeStats.losses}D, ${(homeHomeStats.goalsFor / Math.max(1, homeHomeStats.matches)).toFixed(2)} buts/match) vs ${stats.awayTeam.name} à l'extérieur (${awayAwayStats.wins}V-${awayAwayStats.draws}N-${awayAwayStats.losses}D, ${(awayAwayStats.goalsFor / Math.max(1, awayAwayStats.matches)).toFixed(2)} buts/match)` : ''}
   - Match-up offensif vs défensif: ${homeAvgGoals} (domicile attaque) vs ${awayAvgConceded} (extérieur défense) = ${parseFloat(homeAvgGoals) > parseFloat(awayAvgConceded) ? 'Avantage domicile offensif' : 'Défense extérieure solide'}
   - Match-up défensif vs offensif: ${homeAvgConceded} (domicile défense) vs ${awayAvgGoals} (extérieur attaque) = ${parseFloat(homeAvgConceded) < parseFloat(awayAvgGoals) ? 'Défense domicile solide' : 'Attaque extérieure dangereuse'}
   - Style de jeu: Analyse si les profils s'opposent ou se complètent
   ${homeHomeStats ? `- Avantage domicile ${stats.homeTeam.name}: ${homeHomeStats.matches > 0 ? ((homeHomeStats.wins / homeHomeStats.matches) > 0.5 ? 'RÉEL' : 'FACTICE') : 'Non déterminable'} (${homeHomeStats.wins}V-${homeHomeStats.draws}N-${homeHomeStats.losses}D à domicile)` : ''}
   ${awayAwayStats ? `- Performance extérieure ${stats.awayTeam.name}: ${awayAwayStats.matches > 0 ? ((awayAwayStats.wins / awayAwayStats.matches) > 0.3 ? 'Bonne' : 'Faible') : 'Non déterminable'} (${awayAwayStats.wins}V-${awayAwayStats.draws}N-${awayAwayStats.losses}D à l'extérieur)` : ''}

4. **FACTEURS EXTERNES** (à considérer):
   ${stats.enrichment?.weather ? `🌤️ MÉTÉO:
   - Température: ${stats.enrichment.weather.main.temp}°C (ressenti ${stats.enrichment.weather.main.feels_like}°C)
   - Conditions: ${stats.enrichment.weather.weather[0].description}
   - Vent: ${stats.enrichment.weather.wind.speed} m/s
   - Visibilité: ${(stats.enrichment.weather.visibility / 1000).toFixed(1)} km
   - Impact: ${stats.enrichment.weather.weather[0].main === 'Rain' ? '⚠️ PLUIE - Match peut être ralenti, risque de glissades, passes courtes privilégiées' : stats.enrichment.weather.weather[0].main === 'Snow' ? '❄️ NEIGE - Conditions difficiles, jeu technique limité' : stats.enrichment.weather.wind.speed > 10 ? '💨 VENT FORT - Peut affecter les passes longues, centres et coups francs' : '✅ Conditions normales - Pas d\'impact majeur'}
   ` : ''}
   - Avantage du terrain: réel si stats domicile > stats extérieur, factice sinon
   - Motivation: Match de ${stats.match.league} - importance contextuelle
   - Fatigue potentielle: Enchaînement de matchs (non disponible mais à mentionner si pertinent)

${stats.enrichment?.injuries ? `🏥 BLESSURES ET ABSENTS:
   ${stats.enrichment.injuries.home.length > 0 ? `- ${stats.homeTeam.name}: ${stats.enrichment.injuries.home.map(i => `${i.player.name} (${i.type}: ${i.reason})`).join(', ')}` : `- ${stats.homeTeam.name}: ✅ Aucune blessure majeure signalée`}
   ${stats.enrichment.injuries.away.length > 0 ? `- ${stats.awayTeam.name}: ${stats.enrichment.injuries.away.map(i => `${i.player.name} (${i.type}: ${i.reason})`).join(', ')}` : `- ${stats.awayTeam.name}: ✅ Aucune blessure majeure signalée`}
   ${stats.enrichment.injuries.home.length > 0 || stats.enrichment.injuries.away.length > 0 ? `⚠️ IMPACT: ${stats.enrichment.injuries.home.length > 0 ? `${stats.homeTeam.name} affaiblie` : ''}${stats.enrichment.injuries.home.length > 0 && stats.enrichment.injuries.away.length > 0 ? ' / ' : ''}${stats.enrichment.injuries.away.length > 0 ? `${stats.awayTeam.name} affaiblie` : ''}. Analyser l'impact sur la composition et la tactique.` : ''}
   ` : ''}

${stats.enrichment?.lineups ? `⚽ COMPOSITIONS PROBABLES:
   ${stats.enrichment.lineups.home ? `- ${stats.homeTeam.name}: Formation ${stats.enrichment.lineups.home.formation}, Entraîneur ${stats.enrichment.lineups.home.coach.name}
     Titulaires: ${stats.enrichment.lineups.home.startXI.slice(0, 5).map(p => `${p.player.name} (${p.player.pos})`).join(', ')}${stats.enrichment.lineups.home.startXI.length > 5 ? '...' : ''}` : `- ${stats.homeTeam.name}: Composition non disponible`}
   ${stats.enrichment.lineups.away ? `- ${stats.awayTeam.name}: Formation ${stats.enrichment.lineups.away.formation}, Entraîneur ${stats.enrichment.lineups.away.coach.name}
     Titulaires: ${stats.enrichment.lineups.away.startXI.slice(0, 5).map(p => `${p.player.name} (${p.player.pos})`).join(', ')}${stats.enrichment.lineups.away.startXI.length > 5 ? '...' : ''}` : `- ${stats.awayTeam.name}: Composition non disponible`}
   ${stats.enrichment.lineups.home && stats.enrichment.lineups.away ? `- ANALYSE TACTIQUE: ${stats.enrichment.lineups.home.formation} vs ${stats.enrichment.lineups.away.formation} - Comparer les styles, les forces/faiblesses de chaque formation` : ''}
   ` : ''}

${stats.enrichment?.headToHead && stats.enrichment.headToHead.length > 0 ? `📊 CONFRONTATIONS DIRECTES (${stats.enrichment.headToHead.length} derniers matchs):
   ${stats.enrichment.headToHead.slice(0, 5).map((h2h, idx) => {
     const homeWon = h2h.goals.home !== null && h2h.goals.away !== null && h2h.goals.home > h2h.goals.away
     const awayWon = h2h.goals.home !== null && h2h.goals.away !== null && h2h.goals.home < h2h.goals.away
     const draw = h2h.goals.home !== null && h2h.goals.away !== null && h2h.goals.home === h2h.goals.away
     return `${idx + 1}. ${h2h.teams.home.name} ${h2h.goals.home !== null ? h2h.goals.home : '?'} - ${h2h.goals.away !== null ? h2h.goals.away : '?'} ${h2h.teams.away.name} ${homeWon ? '(Domicile gagne)' : awayWon ? '(Extérieur gagne)' : draw ? '(Nul)' : ''}`
   }).join('\n   ')}
   - ANALYSE: ${stats.enrichment.headToHead.filter(h => h.goals.home !== null && h.goals.away !== null).length > 0 ? 'Tendances historiques, styles de jeu, avantages psychologiques' : 'Données limitées'}
   ` : ''}

5. **SIGNAUX FAIBLES POUVANT ANNONCER UNE SURPRISE**:
   - ⚠️ Équipe supposée faible avec bons indicateurs défensifs (${awayAvgConceded} buts/match) malgré un bilan mitigé → Peut surprendre
   - ⚠️ Équipe favorite en surperformance (${homeWinRate}% victoires mais ${homeAvgConceded} buts/match encaissés) → Risque de correction
   - ⚠️ Compatibilité tactique défavorable: ${parseFloat(homeAvgGoals) < parseFloat(awayAvgConceded) ? 'Attaque domicile faible vs défense extérieure solide' : 'Match-up équilibré'}
   - ⚠️ Baisse d'intensité: Forme récente ${stats.homeForm} vs moyenne générale
   - ⚠️ Inefficacité offensive temporaire: Ratio ${homeBalance} vs ${awayBalance}

6. **ANALYSE STRUCTURÉE REQUISE**:
   - Identifie les FORCES RÉELLES (pas la réputation)
   - Identifie les FAIBLESSES CACHÉES (pas évidentes au premier regard)
   - Détecte les RISQUES de surprise (pourquoi le match peut contredire les tendances)
   - Explique les DYNAMIQUES INVISIBLES (ce que les stats simples ne montrent pas)

❌ NE FAIS PAS:
- Ne te base pas uniquement sur le bilan (V-N-D)
- Ne suis pas bêtement l'avantage du terrain
- Ne prédits pas juste "parce que c'est le favori"
- Ne donne pas de conseils de mise ou stratégie de pari

✅ FAIS:
- Analyse les EFFICACITÉS RÉELLES (offensive et défensive)
- Détecte les INCOHÉRENCES et PARADOXES
- Identifie les SIGNAUX FAIBLES de surprise
- Explique pourquoi un match peut CONTREVENIR aux tendances
- Sois OBJECTIF et NEUTRE, pas suiveur

RÉPONDS UNIQUEMENT EN JSON VALIDE (pas de markdown):
{
  "prediction_1n2": "1" | "X" | "2" | "1X" | "X2" | "12" (utilise double chance si confiance < 50%),
  "confidence_1n2": nombre 0-100 (basé sur la solidité de ton analyse, peut être plus élevé avec double chance),
  "predicted_score": "X-Y" (COHÉRENT avec prediction_1n2 ! Si double chance, choisis le score le plus probable parmi les 2 issues),
  "confidence_score": nombre 0-100,
  "btts": true | false,
  "confidence_btts": nombre 0-100,
  "over_under_2_5": "OVER" | "UNDER",
  "confidence_ou25": nombre 0-100,
  "analysis": "Analyse structurée en français (3-5 phrases). Structure: 1) Forces/faiblesses réelles détectées, 2) Signaux faibles identifiés, 3) Raisons pour lesquelles le match peut surprendre ou suivre les tendances, 4) Conclusion objective. Sois précis, neutre, et fondé sur les données."
}`

  try {
    // Vérifier que la clé API Groq est configurée
    if (!process.env.GROQ_API_KEY) {
      console.warn("⚠️ GROQ_API_KEY non configurée, utilisation du fallback statistique")
      throw new Error("GROQ_API_KEY non configurée")
    }

    // Vérifier le rate limit Groq
    const allowed = await checkRateLimit("groq", GROQ_DAILY_LIMIT)
    if (!allowed) {
      console.warn("⚠️ Limite Groq atteinte, utilisation du fallback statistique")
      throw new Error("Rate limit Groq atteint")
    }

    console.log(`🤖 Génération prédiction IA pour ${stats.match.home.name} vs ${stats.match.away.name}`)
    console.log(`📊 Données envoyées à Groq IA:`)
    console.log(`   - Statistiques complètes des équipes`)
    console.log(`   - Forme récente: ${stats.homeForm} vs ${stats.awayForm}`)
    console.log(`   - Métriques avancées: ${homeAdv ? 'Oui' : 'Non'} (tendances, performance, etc.)`)
    console.log(`   - Enrichissement: ${stats.enrichment ? 'Oui (blessures, lineups, météo, H2H)' : 'Non'}`)
    console.log(`   - Taille du prompt: ${prompt.length} caractères`)
    
    const { text } = await generateText({
      model: "groq/mixtral-8x7b-32768",
      prompt,
      temperature: 0.2, // Plus bas pour plus de cohérence
    })

    console.log(`✅ Réponse IA Groq reçue (${text.length} caractères)`)

    // Nettoyer le texte (enlever markdown si présent)
    let cleanedText = text.trim()
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "")
    }

    const prediction = JSON.parse(cleanedText) as PredictionResult

    // Validation de la cohérence score vs prédiction 1N2 (incluant double chance)
    let validatedScore = prediction.predicted_score || "1-1"
    const scoreParts = validatedScore.split("-")
    if (scoreParts.length === 2) {
      const homeScore = parseInt(scoreParts[0])
      const awayScore = parseInt(scoreParts[1])
      const pred = prediction.prediction_1n2
      
      // Validation pour prédictions simples
      if (pred === "1" && homeScore <= awayScore) {
        // Victoire domicile mais score pas cohérent → Ajuster
        validatedScore = `${Math.max(homeScore, awayScore) + 1}-${awayScore}`
        console.warn(`⚠️ Score incohérent corrigé: ${prediction.predicted_score} → ${validatedScore} (victoire domicile)`)
      } else if (pred === "2" && awayScore <= homeScore) {
        // Victoire extérieur mais score pas cohérent → Ajuster
        validatedScore = `${homeScore}-${Math.max(homeScore, awayScore) + 1}`
        console.warn(`⚠️ Score incohérent corrigé: ${prediction.predicted_score} → ${validatedScore} (victoire extérieur)`)
      } else if (pred === "X" && homeScore !== awayScore) {
        // Match nul mais score pas cohérent → Ajuster
        const avgScore = Math.round((homeScore + awayScore) / 2)
        validatedScore = `${avgScore}-${avgScore}`
        console.warn(`⚠️ Score incohérent corrigé: ${prediction.predicted_score} → ${validatedScore} (match nul)`)
      }
      // Validation pour double chances
      else if (pred === "1X" && homeScore < awayScore) {
        // 1X (domicile ou nul) mais score indique défaite domicile → Ajuster vers nul
        const avgScore = Math.round((homeScore + awayScore) / 2)
        validatedScore = `${avgScore}-${avgScore}`
        console.warn(`⚠️ Score incohérent corrigé: ${prediction.predicted_score} → ${validatedScore} (1X: nul)`)
      } else if (pred === "X2" && homeScore > awayScore) {
        // X2 (nul ou extérieur) mais score indique victoire domicile → Ajuster vers nul
        const avgScore = Math.round((homeScore + awayScore) / 2)
        validatedScore = `${avgScore}-${avgScore}`
        console.warn(`⚠️ Score incohérent corrigé: ${prediction.predicted_score} → ${validatedScore} (X2: nul)`)
      } else if (pred === "12" && homeScore === awayScore) {
        // 12 (victoire domicile ou extérieur) mais score indique nul → Ajuster vers victoire la plus probable
        if (homeScore >= awayScore) {
          validatedScore = `${homeScore + 1}-${awayScore}`
        } else {
          validatedScore = `${homeScore}-${awayScore + 1}`
        }
        console.warn(`⚠️ Score incohérent corrigé: ${prediction.predicted_score} → ${validatedScore} (12: victoire)`)
      }
    }

    // Validation et normalisation
    const validPredictions = ["1", "X", "2", "1X", "X2", "12"]
    return {
      prediction_1n2: validPredictions.includes(prediction.prediction_1n2) ? prediction.prediction_1n2 : "X",
      confidence_1n2: Math.max(0, Math.min(100, prediction.confidence_1n2 || 50)),
      predicted_score: validatedScore,
      confidence_score: Math.max(0, Math.min(100, prediction.confidence_score || 40)),
      btts: typeof prediction.btts === "boolean" ? prediction.btts : basicStats.bttsProb > 0.5,
      confidence_btts: Math.max(0, Math.min(100, prediction.confidence_btts || 50)),
      over_under_2_5: prediction.over_under_2_5 === "OVER" || prediction.over_under_2_5 === "UNDER" ? prediction.over_under_2_5 : (basicStats.over25Prob > 0.5 ? "OVER" : "UNDER"),
      confidence_ou25: Math.max(0, Math.min(100, prediction.confidence_ou25 || 50)),
      analysis: prediction.analysis || "Analyse non disponible",
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    console.error(`❌ Erreur lors de la génération de prédiction IA pour ${stats.match.home.name} vs ${stats.match.away.name}:`, errorMessage)
    
    // Fallback avec les statistiques de base (plus intelligent)
    const homeWin = basicStats.homeWinProb > basicStats.awayWinProb && basicStats.homeWinProb > basicStats.drawProb
    const awayWin = basicStats.awayWinProb > basicStats.homeWinProb && basicStats.awayWinProb > basicStats.drawProb
    
    // Calculer le score prédit basé sur les buts attendus (COHÉRENT avec la prédiction 1N2)
    let homeScore = Math.max(0, Math.round(basicStats.homeExpectedGoals))
    let awayScore = Math.max(0, Math.round(basicStats.awayExpectedGoals))
    
    // Ajuster le score pour qu'il soit cohérent avec la prédiction 1N2
    if (homeWin) {
      // Victoire domicile → domicile doit marquer plus
      if (homeScore <= awayScore) {
        homeScore = awayScore + 1
      }
    } else if (awayWin) {
      // Victoire extérieur → extérieur doit marquer plus
      if (awayScore <= homeScore) {
        awayScore = homeScore + 1
      }
    } else {
      // Match nul → scores égaux
      const avgScore = Math.round((homeScore + awayScore) / 2)
      homeScore = avgScore
      awayScore = avgScore
    }
    
    const predictedScore = `${homeScore}-${awayScore}`
    
    // Calculer la confiance basée sur la différence
    const maxProb = Math.max(basicStats.homeWinProb, basicStats.drawProb, basicStats.awayWinProb)
    const confidence = Math.round(Math.min(85, Math.max(45, maxProb * 100)))
    
    // Analyse experte basée sur les stats (détection de signaux faibles)
    const homeAdvantage = stats.homeTeam.goalsFor - stats.homeTeam.goalsAgainst
    const awayAdvantage = stats.awayTeam.goalsFor - stats.awayTeam.goalsAgainst
    const homeAvgConceded = stats.homeTeam.goalsAgainst / (stats.homeTeam.wins + stats.homeTeam.draws + stats.homeTeam.losses || 1)
    const awayAvgConceded = stats.awayTeam.goalsAgainst / (stats.awayTeam.wins + stats.awayTeam.draws + stats.awayTeam.losses || 1)
    
    let analysis = ""
    if (homeWin) {
      const surprise = homeAdvantage < 0 ? "Malgré des statistiques mitigées, " : ""
      const weakness = homeAvgConceded > 1.5 ? "Attention à la défense qui encaisse beaucoup, " : ""
      analysis = `${surprise}${weakness}${stats.homeTeam.name} bénéficie de l'avantage du terrain et d'un bilan supérieur (${stats.homeTeam.wins}V-${stats.homeTeam.draws}N-${stats.homeTeam.losses}D). ${stats.awayTeam.name} présente des faiblesses défensives (${awayAvgConceded.toFixed(1)} buts/match encaissés en moyenne). Prédiction: Victoire domicile.`
    } else if (awayWin) {
      const surprise = awayAdvantage < 0 ? "Surprise possible : " : ""
      analysis = `${surprise}${stats.awayTeam.name} montre une meilleure efficacité (${stats.awayTeam.wins}V-${stats.awayTeam.draws}N-${stats.awayTeam.losses}D) malgré le déplacement. ${stats.homeTeam.name} a des difficultés défensives (${homeAvgConceded.toFixed(1)} buts/match encaissés). L'avantage du terrain ne suffira peut-être pas. Prédiction: Victoire extérieure.`
    } else {
      const defensive = homeAvgConceded < 1 && awayAvgConceded < 1 ? "Match serré entre deux défenses solides. " : ""
      analysis = `${defensive}Match équilibré entre ${stats.homeTeam.name} (${stats.homeTeam.wins}V-${stats.homeTeam.draws}N-${stats.homeTeam.losses}D) et ${stats.awayTeam.name} (${stats.awayTeam.wins}V-${stats.awayTeam.draws}N-${stats.awayTeam.losses}D). Les statistiques sont proches, l'avantage du terrain pourrait être neutralisé. Prédiction: Match nul.`
    }
    
    return {
      prediction_1n2: homeWin ? "1" : awayWin ? "2" : "X",
      confidence_1n2: confidence,
      predicted_score: predictedScore,
      confidence_score: Math.max(35, Math.min(50, Math.round((homeScore + awayScore) * 10))),
      btts: basicStats.bttsProb > 0.5,
      confidence_btts: Math.round(basicStats.bttsProb * 100),
      over_under_2_5: basicStats.over25Prob > 0.5 ? "OVER" : "UNDER",
      confidence_ou25: Math.round(basicStats.over25Prob * 100),
      analysis: analysis,
    }
  }
}

