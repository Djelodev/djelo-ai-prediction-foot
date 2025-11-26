# 📊 Respect des Limites des Plans Gratuits

## ✅ Football-Data.org (Plan Gratuit)

### Limites du plan gratuit :
- **10 requêtes/minute**
- **12 compétitions maximum**
- Scores et schedules avec délai (delayed)
- Fixtures disponibles
- League Tables disponibles

### Optimisations implémentées :

1. **Rate limiting par minute** :
   - Compteur automatique par minute (reset chaque minute)
   - Blocage automatique si limite atteinte
   - Délai de 6.5 secondes entre chaque requête (pour 4 compétitions = ~26 secondes max)

2. **Limitation des compétitions** :
   - Utilisation de **4 compétitions** seulement (sur 12 autorisées)
   - Compétitions utilisées : Premier League, La Liga, Serie A, Ligue 1
   - Marge de sécurité : 8 compétitions non utilisées

3. **Cache intelligent** :
   - Fixtures mises en cache pendant **3 heures**
   - Réduit drastiquement le nombre d'appels nécessaires
   - Cache ne stocke pas les tableaux vides

4. **Estimation d'utilisation** :
   - Sync initiale : **4 requêtes** (4 compétitions)
   - Temps total : ~26 secondes (avec délais)
   - Syncs suivantes (cache) : **0 requête**
   - **Total : 4 requêtes/minute max** ✅ (bien sous la limite de 10)

### Vérification de l'utilisation :
```bash
GET /api/usage
```

## ✅ Groq AI (Plan Gratuit)

### Limites Groq :
- **Rate limit** : ~30 requêtes/minute
- **Pas de limite quotidienne stricte** mais on limite à 100/jour par sécurité

### Optimisations implémentées :

1. **Cache des prédictions** :
   - Prédictions mises en cache pendant **6 heures**
   - Une prédiction n'est régénérée que si elle a plus de 6h

2. **Rate limiting** :
   - Compteur quotidien (100/jour max)
   - Blocage automatique si limite atteinte
   - Fallback statistique si rate limit atteint

3. **Estimation d'utilisation quotidienne** :
   - Nouveaux matchs : **~10-20 matchs/jour** = 10-20 requêtes
   - Matchs en cache : **0 requête**
   - **Total estimé : 10-20 requêtes/jour** ✅ (bien sous la limite)

### Vérification de l'utilisation :
```bash
GET /api/usage
```

## 📈 Monitoring

### Endpoint de monitoring :
```
GET /api/usage
```

Retourne :
```json
{
  "success": true,
  "stats": {
    "footballData": {
      "used": 2,
      "limit": 10,
      "remaining": 8,
      "percentage": 20,
      "type": "minute",
      "resetIn": "prochaine minute"
    },
    "groq": {
      "used": 12,
      "limit": 100,
      "remaining": 88,
      "percentage": 12,
      "type": "day",
      "resetIn": "minuit"
    }
  },
  "warnings": []
}
```

## 🎯 Résumé

| API | Limite Gratuite | Utilisation Estimée | Marge de Sécurité |
|-----|----------------|---------------------|-------------------|
| Football-Data.org | 10 req/min, 12 compétitions | 4 req/min, 4 compétitions | **60% marge req/min, 67% marge compétitions** ✅ |
| Groq | ~30 req/min | 10-20 req/jour | **Très large marge** ✅ |

## ⚠️ Recommandations

1. **Ne pas synchroniser plus de 2-3 fois par jour** (le cache fait le reste)
2. **Utiliser le bouton "Usage"** dans l'interface pour surveiller
3. **Si limite atteinte**, attendre la prochaine minute (reset automatique)
4. **Respecter les délais** : Le code attend automatiquement 6.5s entre chaque requête

## 🔧 Configuration

Les limites peuvent être ajustées dans :
- `lib/football-data.ts` : `FOOTBALL_DATA_MINUTE_LIMIT = 10`
- `lib/football-data.ts` : `FOOTBALL_DATA_MAX_COMPETITIONS = 12`
- `lib/ai-prediction.ts` : `GROQ_DAILY_LIMIT = 100`

Les durées de cache peuvent être ajustées dans :
- `lib/match-sync.ts` : Cache fixtures (3h)
- `lib/cache.ts` : `CACHE_TTL_HOURS` (6h par défaut)

## 📝 Notes importantes

- **Football-Data.org** : Les scores et schedules sont "delayed" (avec délai) sur le plan gratuit, c'est normal
- Le délai de 6.5 secondes entre requêtes garantit qu'on ne dépasse jamais 10 req/min
- Le cache de 3 heures réduit drastiquement les appels nécessaires
