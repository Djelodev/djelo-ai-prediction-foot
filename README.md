# ⚽ Football AI Predictor

Application de prédiction de matchs de football utilisant l'IA pour analyser et prédire les résultats.

## 🚀 Fonctionnalités

- ✅ Intégration avec API-Football (gratuit - 100 requêtes/jour)
- ✅ Prédictions IA avec Groq (gratuit)
- ✅ Base de données SQLite avec Prisma
- ✅ Système de cache optimisé
- ✅ Endpoints API RESTful
- ✅ Interface moderne et responsive

## 📋 Prérequis

- Node.js 18+ 
- pnpm (ou npm/yarn)
- Clés API gratuites :
  - [API-Football](https://www.api-football.com/) - Plan gratuit (100 req/jour)
  - [Groq](https://console.groq.com/) - Compte gratuit

## 🛠️ Installation

1. **Cloner et installer les dépendances**
```bash
pnpm install
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="file:./dev.db"

# API-Football (gratuit)
API_FOOTBALL_KEY="votre-cle-api-football"
API_FOOTBALL_BASE_URL="https://v3.football.api-sports.io"

# Groq AI (gratuit)
GROQ_API_KEY="votre-cle-groq"

# Cache settings
CACHE_TTL_HOURS=6
```

3. **Initialiser la base de données**

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer la base de données
pnpm db:push
```

4. **Lancer l'application**

```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📚 Structure du Projet

```
├── app/
│   ├── api/
│   │   ├── matches/        # Endpoint pour récupérer les matchs
│   │   ├── predictions/   # Endpoint pour générer les prédictions
│   │   └── sync/          # Endpoint pour synchroniser depuis l'API
│   └── page.tsx           # Page principale
├── components/            # Composants React
├── lib/
│   ├── api-football.ts    # Service API-Football
│   ├── ai-prediction.ts   # Service de prédiction IA
│   ├── cache.ts           # Système de cache
│   ├── db.ts              # Client Prisma
│   └── match-sync.ts      # Synchronisation des matchs
└── prisma/
    └── schema.prisma      # Schéma de base de données
```

## 🔌 Endpoints API

### GET /api/matches
Récupère les matchs à venir

**Query params:**
- `league` (optionnel): Filtrer par ligue
- `days` (optionnel, défaut: 7): Nombre de jours à venir
- `sync` (optionnel): Forcer la synchronisation

**Exemple:**
```bash
GET /api/matches?days=7&sync=true
```

### GET /api/predictions
Génère les prédictions pour les matchs

**Query params:**
- `matchId` (optionnel): ID du match spécifique

**Exemple:**
```bash
GET /api/predictions?matchId=1
```

### POST /api/predictions
Génère une prédiction pour un match

**Body:**
```json
{
  "matchId": 1
}
```

### GET /api/sync
Synchronise les matchs depuis l'API-Football

**Query params:**
- `days` (optionnel, défaut: 7): Nombre de jours à synchroniser

**Exemple:**
```bash
GET /api/sync?days=7
```

## 🗄️ Base de Données

Le schéma Prisma inclut :

- **Team**: Équipes de football
- **Match**: Matchs avec dates, scores, etc.
- **Prediction**: Prédictions IA pour chaque match
- **Cache**: Cache pour optimiser les performances

Pour visualiser la base de données :
```bash
pnpm db:studio
```

## 🎯 Utilisation

1. **Synchroniser les matchs**
   - Cliquez sur "Actualiser" dans l'interface
   - Ou appelez `/api/sync?days=7`

2. **Voir les prédictions**
   - Les prédictions sont générées automatiquement
   - Ou générez-les manuellement via `/api/predictions`

3. **Filtrer par ligue**
   - Utilisez les filtres en haut de la page

## 🔧 Configuration

### Cache
Le système de cache utilise :
- Cache mémoire pour les accès rapides
- Cache base de données pour la persistance
- TTL configurable via `CACHE_TTL_HOURS`

### Football-Data.org
- Plan gratuit : 10 requêtes/minute (suffisant pour notre usage)
- Token optionnel : Obtenez un token gratuit sur https://www.football-data.org/register pour plus de requêtes
- Ligues supportées : Premier League, La Liga, Serie A, Ligue 1, Bundesliga, Champions League, Europa League
- **Avantage** : Fonctionne pour les matchs à venir (pas seulement les saisons passées)

### Groq AI
- Compte gratuit disponible
- Modèle utilisé : `groq/mixtral-8x7b-32768`
- Temperature : 0.2 pour plus de cohérence

## 📝 Notes

- Les données sont mises en cache pour optimiser les performances
- Les prédictions sont régénérées toutes les 6 heures
- En cas d'erreur API, l'application utilise des données de fallback

## 🐛 Dépannage

**Erreur "API_FOOTBALL_KEY non configurée"**
- Vérifiez que votre clé API est dans le fichier `.env`
- Assurez-vous que le fichier `.env` est à la racine du projet

**Erreur de base de données**
- Exécutez `pnpm prisma generate`
- Puis `pnpm db:push`

**Pas de matchs affichés**
- Vérifiez votre clé API-Football
- Appelez `/api/sync` pour synchroniser les matchs

## 📄 Licence

MIT

