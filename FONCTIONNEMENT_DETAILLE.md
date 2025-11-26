# 📋 Fonctionnement Détaillé de l'Application

## 🎯 Vue d'Ensemble

Cette application est un **système de prédiction de matchs de football** qui utilise l'IA pour analyser les données et générer des pronostics professionnels. Elle fonctionne en plusieurs étapes automatiques.

---

## 🔄 Workflow Complet (De A à Z)

### 1️⃣ **DÉMARRAGE DE L'APPLICATION**

Quand vous ouvrez l'application dans votre navigateur (`http://localhost:3000`) :

1. **Page principale** (`app/page.tsx`) se charge
2. **Composant `PredictionsDashboard`** est rendu
3. **Effet `useEffect`** se déclenche automatiquement
4. **Fonction `loadMatches()`** est appelée

---

### 2️⃣ **SYNCHRONISATION DES MATCHS** (`/api/sync`)

#### Ce qui se passe :

1. **Appel API** : `GET /api/sync?days=7`
   - Le frontend appelle cet endpoint automatiquement

2. **Backend** (`app/api/sync/route.ts`) :
   - **Étape A** : Synchronise les **matchs passés** (30 derniers jours)
     - Récupère les matchs terminés depuis API-Football
     - Calcule les statistiques des équipes (victoires, défaites, buts, etc.)
     - Met à jour la base de données avec ces stats
   
   - **Étape B** : Synchronise les **matchs à venir** (7 prochains jours)
     - Appelle `syncMatchesFromAPI(7)`
     - Utilise API-Football si configuré, sinon Football-Data.org (fallback)

3. **Service de synchronisation** (`lib/match-sync.ts`) :
   - **Vérifie le cache** : Regarde si des matchs ont déjà été récupérés aujourd'hui
   - **Appel API externe** :
     - Si `API_FOOTBALL_KEY` est configuré → Utilise `lib/api-football-ultra.ts`
     - Sinon → Utilise `lib/football-data.ts` (fallback gratuit)
   
   - **Pour chaque ligue** (Premier League, La Liga, Serie A, Ligue 1, etc.) :
     - Fait un appel API pour récupérer les matchs
     - Respecte les limites de rate limiting (10 req/min pour Football-Data, 75k/jour pour API-Football)
     - Attend entre les requêtes si nécessaire
   
   - **Pour chaque match récupéré** :
     - **Crée ou met à jour les équipes** dans la base :
       - Cherche si l'équipe existe déjà (par `apiId`)
       - Si non, crée une nouvelle équipe
       - Stocke : nom, logo, ligue
     
     - **Crée ou met à jour le match** :
       - Stocke : date, heure, ligue, statut, scores (si disponibles)
       - Lie le match aux équipes (homeTeam, awayTeam)
       - Utilise `upsert` pour éviter les doublons

4. **Résultat** :
   - Retourne le nombre de matchs synchronisés
   - Met à jour la base de données SQLite

---

### 3️⃣ **RÉCUPÉRATION DES MATCHS** (`/api/matches`)

#### Ce qui se passe :

1. **Appel API** : `GET /api/matches?days=7`
   - Le frontend appelle cet endpoint après la synchronisation

2. **Backend** (`app/api/matches/route.ts`) :
   - **Requête à la base de données** :
     - Cherche les matchs avec :
       - `date >= aujourd'hui`
       - `status = "scheduled"` (programmés)
       - Optionnel : filtre par ligue
     - Limite à 50 matchs
     - Inclut : équipes (homeTeam, awayTeam), prédictions existantes
   
   - **Si aucun match trouvé** :
     - Essaie sans filtre de statut
     - Met à jour les statuts si nécessaire
   
   - **Formatage des données** :
     - Transforme les données Prisma en format JSON
     - Ajoute les statistiques des équipes (wins, draws, losses, goalsFor, goalsAgainst)
     - Inclut les prédictions si elles existent

3. **Retour au frontend** :
   - JSON avec : `{ matches: [...], count: X }`
   - Chaque match contient :
     - Informations de base (équipes, date, ligue)
     - Statistiques des équipes
     - Prédiction (si générée)

---

### 4️⃣ **AFFICHAGE DANS L'INTERFACE**

#### Ce qui se passe :

1. **Frontend** (`components/predictions-dashboard.tsx`) :
   - Reçoit les matchs depuis `/api/matches`
   - **Filtre par ligue** (si l'utilisateur a sélectionné une ligue)
   - **Trie par date** (matchs les plus proches en premier)
   - **Affiche chaque match** dans une `MatchCard`

2. **Pour chaque match** (`components/match-card.tsx`) :
   - Affiche :
     - Logo/nom des équipes
     - Date et heure
     - Ligue
     - Statistiques (W-D-L, buts marqués/encaissés)
     - **Prédiction** (si disponible)
   
   - **Si pas de prédiction** :
     - Affiche "Génération de l'analyse en cours..."
     - Appelle automatiquement `/api/predictions?matchId=X` en arrière-plan

---

### 5️⃣ **GÉNÉRATION DES PRÉDICTIONS** (`/api/predictions`)

#### Ce qui se passe :

1. **Déclenchement** :
   - Automatique : Si des matchs n'ont pas de prédiction, le frontend appelle `/api/predictions` (sans paramètre)
   - Manuel : L'utilisateur peut cliquer sur un match pour forcer la génération

2. **Backend** (`app/api/predictions/route.ts`) :

   #### Pour chaque match sans prédiction :

   **A. Calcul des statistiques avancées** (`calculateTeamStats`) :
   
   - **Récupère les 20 derniers matchs** de chaque équipe depuis la base
   - **Calcule pour chaque équipe** :
     
     **Statistiques globales** :
     - Victoires, nuls, défaites
     - Buts marqués, buts encaissés
     - Différence de buts
     
     **Statistiques séparées domicile/extérieur** :
     - Performance à domicile (wins, draws, losses, goals)
     - Performance à l'extérieur (wins, draws, losses, goals)
     
     **Forme récente** (5 derniers matchs) :
     - String de forme : "WWDLW" (Win, Win, Draw, Loss, Win)
     - Points récents (3 pour victoire, 1 pour nul)
     - Buts marqués/encaissés récents
     
     **Tendances** (10 derniers vs 10 précédents) :
     - Évolution des points
     - Évolution des buts marqués
     - Évolution des buts encaissés
     - Indicateur : amélioration, déclin, ou stable
     
     **Qualité des performances** :
     - Victoires larges (3+ buts d'écart)
     - Victoires serrées (1 but d'écart)
     - Défaites larges vs serrées
     - Ratio de "qualité" (victoires dominantes / total victoires)
     
     **Efficacités** :
     - Efficacité offensive (buts/match)
     - Efficacité défensive (buts encaissés/match)
     - Ratio attaque/défense
     - Taux de victoires, nuls

   **B. Récupération des données d'enrichissement** :
   
   - Cherche dans `MatchEnrichment` si le match a été enrichi
   - Si oui, récupère :
     - **Blessures** : Liste des joueurs blessés/suspendus par équipe
     - **Compositions** : Lineups probables avec formations
     - **Météo** : Conditions météo (température, pluie, vent, etc.)
     - **Head-to-head** : Historique des confrontations directes
     - **Statistics** : Statistiques détaillées du match

   **C. Génération de la prédiction IA** (`lib/ai-prediction.ts`) :

   - **Construction du prompt** :
     - Inclut TOUTES les statistiques calculées
     - Inclut les données d'enrichissement (blessures, lineups, météo, etc.)
     - Instructions détaillées pour l'IA :
       - Analyser les efficacités réelles (pas juste les résultats)
       - Détecter les signaux faibles de surprise
       - Identifier les incohérences et paradoxes
       - Ne pas suivre bêtement les stats
       - Être cohérent (score exact = prédiction 1N2)
     
   - **Appel à Groq AI** :
     - Modèle : `mixtral-8x7b-32768`
     - Temperature : 0.2 (pour plus de cohérence)
     - Vérifie le rate limiting (100 req/jour gratuit)
     - Parse la réponse JSON
     
   - **Réponse attendue** :
     ```json
     {
       "prediction_1n2": "1" | "X" | "2",
       "confidence_1n2": 0-100,
       "predicted_score": "2-1",
       "confidence_score": 0-100,
       "btts": true | false,
       "confidence_btts": 0-100,
       "over_under_2_5": "OVER" | "UNDER",
       "confidence_ou25": 0-100,
       "analysis": "Analyse détaillée en français..."
     }
     ```
     
   - **Fallback** : Si l'IA échoue, utilise des calculs statistiques basiques

   **D. Sauvegarde en base de données** :
   
   - Crée ou met à jour l'entrée `Prediction` :
     - Probabilités 1N2 (win1, draw, win2)
     - Score exact prédit
     - BTTS (Both Teams To Score)
     - Over/Under 2.5
     - Analyse textuelle
     - Confiance globale
     - Timestamp de création/mise à jour

3. **Retour au frontend** :
   - La prédiction est maintenant disponible
   - Le frontend recharge automatiquement les matchs après 3 secondes
   - Les nouvelles prédictions s'affichent

---

### 6️⃣ **ENRICHISSEMENT DES MATCHS** (`/api/enrich`) - Optionnel

#### Ce qui se passe :

1. **Déclenchement** :
   - Manuel : Appel `POST /api/enrich` pour enrichir tous les matchs
   - Ou : `GET /api/enrich?matchId=X` pour un match spécifique

2. **Backend** (`app/api/enrich/route.ts`) :
   
   - **Pour chaque match** :
     - Appelle `getMatchFullData(fixtureId)` depuis `lib/api-football-ultra.ts`
     - Récupère en parallèle :
       - **Blessures** : `getTeamInjuries(teamId)` pour chaque équipe
       - **Lineups** : `getMatchLineup(fixtureId)`
       - **Statistics** : `getMatchStatistics(fixtureId)`
       - **Head-to-head** : `getHeadToHead(homeTeamId, awayTeamId)`
     
     - **Météo** : Appelle `getMatchWeather(city, country)` depuis `lib/football-enrichment.ts`
       - Utilise OpenWeatherMap API
       - Récupère température, conditions, vent, visibilité
   
   - **Sauvegarde** :
     - Crée ou met à jour `MatchEnrichment` en base
     - Stocke tout en JSON
     - Cache pendant 6 heures

3. **Utilisation** :
   - Ces données sont automatiquement incluses dans le prompt IA
   - L'IA peut analyser l'impact des blessures, formations, météo, etc.

---

## 🗄️ Structure de la Base de Données

### Tables principales :

1. **Team** :
   - Informations des équipes
   - Statistiques calculées (wins, draws, losses, goalsFor, goalsAgainst)

2. **Match** :
   - Informations des matchs
   - Liens vers les équipes (homeTeam, awayTeam)
   - Date, heure, ligue, statut, scores
   - Optionnel : venue, city, country (pour la météo)

3. **Prediction** :
   - Prédictions IA pour chaque match
   - Probabilités, scores, analyses
   - Timestamps

4. **MatchEnrichment** :
   - Données complémentaires (blessures, lineups, météo)
   - Stockées en JSON

5. **Cache** :
   - Cache des réponses API
   - TTL (Time To Live) pour expiration

---

## 🔄 Flux de Données Complet

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR                               │
│              Ouvre l'application                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React/Next.js)                        │
│  - PredictionsDashboard                                      │
│  - MatchCard (pour chaque match)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 1. Appel API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (/api/sync)                         │
│  - Vérifie le cache                                          │
│  - Appelle API-Football ou Football-Data.org                 │
│  - Synchronise les matchs                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 2. Stockage
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES (SQLite)                        │
│  - Team, Match, Prediction, MatchEnrichment, Cache          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 3. Récupération
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (/api/matches)                      │
│  - Récupère les matchs depuis la DB                          │
│  - Formate les données                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 4. Affichage
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND                                        │
│  - Affiche les matchs                                        │
│  - Détecte les matchs sans prédiction                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 5. Génération prédiction
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (/api/predictions)                   │
│  - Calcule les stats avancées                                │
│  - Récupère l'enrichissement (si disponible)                 │
│  - Appelle Groq AI                                           │
│  - Sauvegarde la prédiction                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 6. Affichage prédiction
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND                                        │
│  - Affiche la prédiction dans MatchCard                      │
│  - Analyse IA, probabilités, score exact, etc.              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Points Clés

### Automatisation :
- ✅ Synchronisation automatique au chargement
- ✅ Génération automatique des prédictions pour les matchs sans prédiction
- ✅ Rechargement automatique après génération

### Optimisations :
- ✅ Cache pour éviter les appels API inutiles
- ✅ Rate limiting pour respecter les limites des APIs
- ✅ Calculs de stats en local (pas besoin d'appeler l'API pour chaque prédiction)

### Données Utilisées :
- ✅ Statistiques historiques (20 derniers matchs)
- ✅ Forme récente (5 derniers)
- ✅ Tendances (amélioration/déclin)
- ✅ Performance domicile vs extérieur
- ✅ Qualité des victoires
- ✅ Efficacités offensive/défensive
- ✅ Blessures et suspensions (si enrichi)
- ✅ Compositions probables (si enrichi)
- ✅ Météo (si enrichi)
- ✅ Confrontations directes (si enrichi)

### Intelligence Artificielle :
- ✅ Prompt détaillé avec toutes les données
- ✅ Instructions pour détecter les surprises
- ✅ Analyse contextuelle et non suiveuse
- ✅ Cohérence entre prédiction 1N2 et score exact

---

## 📊 Exemple Concret

**Match** : Manchester City vs Liverpool (Premier League)

1. **Synchronisation** :
   - Récupère le match depuis API-Football
   - Stocke en base avec date, heure, équipes

2. **Calcul des stats** :
   - Manchester City : 15V-3N-2D, 45 buts marqués, 18 encaissés
   - Liverpool : 14V-4N-2D, 42 buts marqués, 20 encaissés
   - Forme récente : MC "WWWDL", Liverpool "WWWDW"
   - Tendances : MC en amélioration (+3 pts), Liverpool stable
   - Performance domicile MC : 8V-1N-1D (excellent)
   - Performance extérieure Liverpool : 6V-2N-2D (bonne)

3. **Enrichissement** (si disponible) :
   - MC : De Bruyne blessé (genou)
   - Liverpool : Aucune blessure majeure
   - Formations : MC 4-3-3, Liverpool 4-3-3
   - Météo : 12°C, pluie modérée

4. **Prédiction IA** :
   - Analyse toutes ces données
   - Détecte que MC a l'avantage du terrain mais De Bruyne manque
   - Liverpool en bonne forme extérieure
   - Météo peut ralentir le jeu
   - **Prédiction** : Match serré, possible nul ou victoire MC serrée
   - **Score** : 2-1 ou 1-1
   - **BTTS** : Oui (70%)
   - **Over 2.5** : Oui (65%)

5. **Affichage** :
   - Carte du match avec toutes les infos
   - Prédiction avec confiance
   - Analyse détaillée de l'IA

---

## 🔧 Technologies Utilisées

- **Frontend** : Next.js 16, React, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : SQLite avec Prisma ORM
- **APIs Externes** :
  - API-Football (Plan Ultra) : Matchs, blessures, lineups, stats
  - Football-Data.org (Fallback) : Matchs basiques
  - OpenWeatherMap : Météo
  - Groq AI : Prédictions IA
- **Cache** : Mémoire + Base de données
- **Rate Limiting** : Système custom pour respecter les limites

---

## ✅ Résultat Final

L'utilisateur voit :
- 📅 Liste des matchs à venir (7 jours)
- 📊 Statistiques détaillées de chaque équipe
- 🤖 Prédictions IA avec :
  - Probabilité 1N2 (victoire domicile, nul, victoire extérieure)
  - Score exact prédit
  - BTTS (Both Teams To Score)
  - Over/Under 2.5
  - Analyse textuelle détaillée
  - Niveau de confiance

**Tout est automatique !** L'utilisateur n'a qu'à ouvrir l'application et tout se fait en arrière-plan.

