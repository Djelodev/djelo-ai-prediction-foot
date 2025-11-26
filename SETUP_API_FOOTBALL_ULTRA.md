# 🚀 Configuration API-Football Plan Ultra

## Plan Ultra : $29/mois - 75 000 requêtes/jour

Avec le plan Ultra, vous avez accès à **TOUTES** les données nécessaires pour des prédictions de qualité professionnelle !

---

## ✅ Données Disponibles

### Matchs
- ✅ Fixtures (matchs à venir et passés)
- ✅ Scores en direct
- ✅ Statuts des matchs

### Données Complémentaires
- ✅ **Injuries** (blessures)
- ✅ **Suspensions**
- ✅ **Lineups** (compositions probables)
- ✅ **Statistics** (statistiques détaillées)
- ✅ **Head-to-head** (confrontations directes)
- ✅ **Predictions** (prédictions de l'API)
- ✅ **Players & Coaches**
- ✅ **Transfers**

---

## 🔧 Configuration

### 1. Obtenir votre clé API via Dashboard API-Football

**Vous utilisez le dashboard officiel** : https://www.api-football.com/documentation-v3

#### Étapes détaillées :

1. **Allez sur le dashboard** : https://dashboard.api-football.com
   - Ou via la documentation : https://www.api-football.com/documentation-v3

2. **Créez un compte** (si vous n'en avez pas)
   - Cliquez sur "Register" ou "Sign in"
   - Remplissez le formulaire d'inscription

3. **Souscrivez au plan Ultra**
   - Allez dans la section "Pricing" ou "Subscription"
   - Choisissez le **plan Ultra** ($29/mois - 75 000 requêtes/jour)
   - Complétez le paiement

4. **Récupérez votre clé API**
   - Connectez-vous à votre dashboard
   - Allez dans la section "API Keys" ou "My API Key"
   - Copiez votre clé API (elle ressemble à : `abc123def456...`)

5. **Ajoutez-la dans `.env`**
   ```env
   API_FOOTBALL_KEY="votre-cle-api-football-ici"
   ```

**Note** : Le code détecte automatiquement que c'est une clé du dashboard et utilise le bon header (`x-apisports-key`).

### 2. Configurer dans `.env`

```env
# API-Football Plan Ultra (Dashboard)
API_FOOTBALL_KEY="votre-cle-api-football-ici"
```

**Note** : Le code détecte automatiquement que c'est une clé du dashboard et utilise le header `x-apisports-key`.

### 3. Mettre à jour la base de données

```bash
pnpm prisma db push
```

---

## 📊 Utilisation

### Synchronisation des Matchs

L'application utilise automatiquement API-Football si la clé est configurée :

```bash
# Synchronisation automatique au chargement
GET /api/sync?days=7
```

### Enrichissement des Matchs

Pour enrichir un match avec toutes les données :

```bash
# Enrichir un match spécifique
GET /api/enrich?matchId=1

# Enrichir tous les matchs à venir
POST /api/enrich
```

### Données Enrichies

Chaque match enrichi contient :
- **Blessures** : Liste des joueurs blessés/suspendus
- **Compositions** : Lineups probables avec formations
- **Météo** : Conditions météo (via OpenWeatherMap)
- **Statistics** : Stats détaillées du match
- **Head-to-head** : Historique des confrontations

---

## 🎯 Intégration dans l'IA

Toutes ces données sont automatiquement intégrées dans le prompt de l'IA :

### Exemple de données envoyées à l'IA :

```
🏥 BLESSURES ET ABSENTS:
- Manchester City: Kevin De Bruyne (Injury: Knee), Erling Haaland (Suspension: Red card)
- Liverpool: ✅ Aucune blessure majeure signalée

⚽ COMPOSITIONS PROBABLES:
- Manchester City: Formation 4-3-3, Entraîneur Pep Guardiola
  Titulaires: Ederson (GK), Walker (DEF), Dias (DEF), Stones (DEF), Cancelo (DEF)...
- Liverpool: Formation 4-3-3, Entraîneur Jürgen Klopp
  Titulaires: Alisson (GK), Alexander-Arnold (DEF), Van Dijk (DEF), Matip (DEF), Robertson (DEF)...

🌤️ MÉTÉO:
- Température: 12°C (ressenti 10°C)
- Conditions: Pluie modérée
- Vent: 15 m/s
- Impact: ⚠️ PLUIE - Match peut être ralenti, risque de glissades

📊 CONFRONTATIONS DIRECTES (5 derniers matchs):
1. Manchester City 2 - 1 Liverpool (Domicile gagne)
2. Liverpool 1 - 0 Manchester City (Domicile gagne)
...
```

---

## 💰 Coût et Limites

### Plan Ultra
- **Prix** : $29/mois
- **Requêtes/jour** : 75 000
- **Requêtes/minute** : Illimité (avec rate limiting raisonnable)

### Estimation d'utilisation

Pour une application de pronostics avec 50 matchs/jour :
- **Fixtures** : ~10 requêtes/jour (par ligue)
- **Enrichissement** : ~200 requêtes/jour (4 par match : injuries x2, lineups, statistics)
- **Total** : ~210 requêtes/jour

**Vous êtes largement en dessous de la limite !** 🎉

---

## 🔄 Workflow Recommandé

1. **Synchronisation quotidienne** (automatique)
   - Récupère les matchs à venir
   - Met à jour les scores

2. **Enrichissement** (avant les matchs)
   - Enrichit les matchs 24h avant
   - Cache les données (6h)

3. **Prédictions IA**
   - Utilise toutes les données enrichies
   - Génère des prédictions expertes

---

## 🐛 Dépannage

### Erreur : "API_FOOTBALL_KEY non configurée"
- Vérifiez que la clé est dans `.env`
- Redémarrez le serveur

### Erreur : "Limite API-Football atteinte"
- Vérifiez votre usage sur RapidAPI
- Avec 75k req/jour, cela ne devrait pas arriver
- Vérifiez les logs pour identifier les appels excessifs

### Pas de données enrichies
- Vérifiez que le match a un `apiId`
- Appelez `/api/enrich?matchId=X` manuellement
- Vérifiez les logs pour les erreurs API

---

## 📝 Prochaines Étapes

1. ✅ Configurer `API_FOOTBALL_KEY` dans `.env`
2. ✅ Mettre à jour la base : `pnpm prisma db push`
3. ✅ Synchroniser les matchs : `/api/sync`
4. ✅ Enrichir les matchs : `/api/enrich`
5. ✅ Générer les prédictions : `/api/predictions`

---

## 🎉 Résultat

Avec le plan Ultra, votre IA a accès à :
- ✅ Statistiques complètes
- ✅ Blessures et suspensions
- ✅ Compositions probables
- ✅ Météo
- ✅ Confrontations directes
- ✅ Statistics détaillées

**Vos prédictions seront d'un niveau professionnel !** 🚀

