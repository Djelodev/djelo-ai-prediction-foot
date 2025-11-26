# 🔄 Architecture de Synchronisation

## Vue d'Ensemble

L'application a été modifiée pour **éviter les appels API coûteux** à chaque chargement. Les matchs sont maintenant synchronisés **une seule fois** et servis depuis la base de données à tous les utilisateurs.

## 🎯 Principe

1. **Synchronisation unique** : Les matchs sont synchronisés depuis l'API externe une seule fois
2. **Stockage en base** : Tous les matchs et prédictions sont stockés en base de données
3. **Service depuis la DB** : Les utilisateurs reçoivent les données depuis la base de données uniquement
4. **Pas d'appels répétés** : Aucun appel API externe lors du chargement de la page

## 📊 Flux de Données

```
┌─────────────────────────────────────────────────────────┐
│  API Externe (API-Football / Football-Data.org)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ (1 seule fois)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  /api/sync (Manuel) ou /api/cron/sync (Automatique)   │
│  - Récupère les matchs depuis l'API externe           │
│  - Stocke en base de données                          │
│  - Génère les prédictions                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Base de Données (SQLite)                              │
│  - Matchs                                              │
│  - Prédictions                                        │
│  - Statistiques                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ (Tous les utilisateurs)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  /api/matches                                          │
│  - Lit UNIQUEMENT depuis la base de données            │
│  - Aucun appel API externe                             │
│  - Rapide et gratuit                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend (Dashboard)                                  │
│  - Affiche les matchs depuis la DB                     │
│  - Pas de synchronisation automatique                  │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Endpoints

### `/api/matches`
- **Rôle** : Récupérer les matchs depuis la base de données
- **Comportement** : Ne fait **AUCUN** appel API externe
- **Utilisation** : Appelé automatiquement par le frontend
- **Coût** : Gratuit (lecture DB uniquement)

### `/api/sync`
- **Rôle** : Synchroniser les matchs depuis l'API externe
- **Comportement** : Fait des appels API externes coûteux
- **Utilisation** : Bouton "Synchroniser" dans le dashboard (manuel)
- **Coût** : Utilise les quotas API

### `/api/cron/sync`
- **Rôle** : Synchronisation automatique (pour cron jobs)
- **Comportement** : Identique à `/api/sync` mais pour automatisation
- **Utilisation** : Appelé par un service de cron (Vercel Cron, GitHub Actions, etc.)
- **Sécurité** : Protégé par `CRON_SECRET` (optionnel mais recommandé)

## ⚙️ Configuration

### Synchronisation Manuelle

Les utilisateurs peuvent cliquer sur le bouton **"Synchroniser"** dans le dashboard pour forcer une synchronisation.

### Synchronisation Automatique (Recommandé)

Pour synchroniser automatiquement les matchs, configurez un cron job :

#### Option 1 : Vercel Cron (si déployé sur Vercel)

Créez `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Cela synchronisera toutes les 6 heures.

#### Option 2 : GitHub Actions

Créez `.github/workflows/sync.yml` :

```yaml
name: Sync Matches
on:
  schedule:
    - cron: '0 */6 * * *'  # Toutes les 6 heures
  workflow_dispatch:  # Permet de déclencher manuellement

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Matches
        run: |
          curl -X GET "https://votre-domaine.com/api/cron/sync" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option 3 : Service externe (cron-job.org, etc.)

Configurez un appel HTTP vers :
```
GET https://votre-domaine.com/api/cron/sync
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

### Variable d'Environnement

Ajoutez dans `.env` :

```env
CRON_SECRET=votre-secret-super-securise
```

## 💰 Économies

### Avant
- Chaque utilisateur qui charge la page → Appel API externe
- 100 utilisateurs/jour = 100 appels API/jour
- Coût élevé avec les quotas API

### Après
- Synchronisation 1 fois toutes les 6 heures = 4 appels/jour
- 100 utilisateurs/jour = 0 appels API (lecture DB uniquement)
- **Économie de 96% sur les appels API**

## 📝 Notes

1. **Fréquence de synchronisation** : Recommandé toutes les 6 heures pour avoir des données à jour
2. **Prédictions** : Générées automatiquement lors de la synchronisation
3. **Cache** : Les données sont en base, pas besoin de cache supplémentaire
4. **Performance** : Lecture DB très rapide, pas de latence API externe

## 🔒 Sécurité

L'endpoint `/api/cron/sync` peut être protégé avec un secret :

```bash
# Appel sécurisé
curl -X GET "https://votre-domaine.com/api/cron/sync" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Sans le secret, l'endpoint retournera une erreur 401.

