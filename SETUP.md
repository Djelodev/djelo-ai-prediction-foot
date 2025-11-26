# 🚀 Guide de Configuration

## ⚡ Option Recommandée : API-Football Plan Ultra ($29/mois)

Pour des prédictions de niveau professionnel avec **TOUTES** les données (blessures, lineups, météo, etc.), utilisez le plan Ultra d'API-Football.

**Voir le guide complet** : [SETUP_API_FOOTBALL_ULTRA.md](./SETUP_API_FOOTBALL_ULTRA.md)

### Configuration Rapide
1. Souscrivez au plan Ultra sur https://rapidapi.com/api-sports/api/api-football
2. Ajoutez dans `.env` : `API_FOOTBALL_KEY="votre-cle-ici"`
3. C'est tout ! L'application utilisera automatiquement API-Football.

---

## Étape 1 : Obtenir les clés API (Option Gratuite)

### Football-Data.org (GRATUIT - Fallback)
1. Allez sur https://www.football-data.org/register
2. Créez un compte gratuit (optionnel mais recommandé)
3. Obtenez un token API gratuit
4. Ajoutez-le dans `.env` comme `FOOTBALL_DATA_API_TOKEN`

**Note** : Le plan gratuit fonctionne sans token, mais avec un token vous avez plus de requêtes par minute. **Utilisé en fallback si API-Football n'est pas configuré.**

### Groq AI (GRATUIT)
1. Allez sur https://console.groq.com/
2. Créez un compte gratuit
3. Allez dans "API Keys"
4. Créez une nouvelle clé API
5. Copiez votre clé

## Étape 2 : Configuration

1. **Créez le fichier `.env`** à la racine du projet :

```env
# Database
DATABASE_URL="file:./dev.db"

# API-Football Plan Ultra (RECOMMANDÉ - $29/mois)
# Obtenez votre clé sur https://rapidapi.com/api-sports/api/api-football
# Données complètes : injuries, lineups, statistics, head-to-head, etc.
API_FOOTBALL_KEY=""

# Football-Data.org (GRATUIT - Fallback)
# Optionnel: utilisé si API_FOOTBALL_KEY n'est pas configuré
# Obtenir un token gratuit sur https://www.football-data.org/register
FOOTBALL_DATA_API_TOKEN="votre-token-optionnel-ici"

# OpenWeatherMap (GRATUIT - Pour la météo)
# Obtenir une clé gratuite sur https://openweathermap.org/api
OPENWEATHER_API_KEY=""

# Groq AI
GROQ_API_KEY="votre-cle-groq-ici"

# Cache (optionnel)
CACHE_TTL_HOURS=6
```

2. **Installez les dépendances** :
```bash
pnpm install
```

3. **Initialisez la base de données** :
```bash
pnpm prisma generate
pnpm db:push
```

4. **Lancez l'application** :
```bash
pnpm dev
```

## Étape 3 : Première utilisation

1. Ouvrez http://localhost:3000
2. Cliquez sur "Actualiser" pour synchroniser les matchs
3. Les prédictions seront générées automatiquement

## ⚠️ Notes importantes

- **Football-Data.org** : 
  - Sans token : 10 requêtes/minute (suffisant pour notre usage)
  - Avec token gratuit : Plus de requêtes par minute
  - Le cache réduit le nombre d'appels nécessaires
  - Les matchs sont mis en cache pendant 3 heures
  - **Avantage** : Fonctionne pour les matchs à venir, pas seulement les saisons passées

- **Groq AI** : Limite de taux selon votre plan
  - Les prédictions sont mises en cache pour éviter les appels répétés
  - Une prédiction est valide pendant 6 heures

- **Base de données** : SQLite (fichier local)
  - Le fichier `dev.db` sera créé automatiquement
  - Vous pouvez le visualiser avec `pnpm db:studio`

## 🔧 Dépannage

### Erreur "API_FOOTBALL_KEY non configurée"
- Vérifiez que le fichier `.env` existe et contient `API_FOOTBALL_KEY`
- Redémarrez le serveur de développement

### Erreur "Cannot find module 'ai'"
- Exécutez `pnpm install` pour installer les dépendances
- Vérifiez que `ai` est dans `package.json`

### Pas de matchs affichés
- Vérifiez que vous avez bien des matchs programmés dans la période
- Appelez `/api/sync?days=7` pour forcer la synchronisation
- Vérifiez les logs du serveur pour voir les réponses de l'API
- Si vous avez un token, vérifiez qu'il est correct dans `.env`
- Vérifiez les logs de la console pour les erreurs

### Erreur de base de données
- Exécutez `pnpm prisma generate`
- Puis `pnpm db:push`
- Supprimez `dev.db` et réessayez si nécessaire

