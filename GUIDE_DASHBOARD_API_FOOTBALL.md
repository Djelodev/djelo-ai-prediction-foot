# 📚 Guide Complet : Dashboard API-Football

## 🎯 Vous utilisez le Dashboard Officiel

**URL** : https://www.api-football.com/documentation-v3  
**Dashboard** : https://dashboard.api-football.com

---

## ✅ Avantages du Dashboard Officiel

- ✅ **Site officiel** d'API-Football
- ✅ **Interface dédiée** au football
- ✅ **Support direct** de l'équipe API-Football
- ✅ **Documentation complète** et à jour
- ✅ **Même prix** que RapidAPI ($29/mois pour Ultra)

---

## 🔧 Configuration Étape par Étape

### Étape 1 : Créer un compte

1. Allez sur https://dashboard.api-football.com
2. Cliquez sur **"Register"** ou **"Sign in"**
3. Remplissez le formulaire :
   - Email
   - Mot de passe
   - Confirmez votre email

### Étape 2 : Souscrire au Plan Ultra

1. Une fois connecté, allez dans **"Pricing"** ou **"Subscription"**
2. Choisissez le **plan Ultra** :
   - **Prix** : $29/mois
   - **Requêtes** : 75 000/jour
   - **Toutes les fonctionnalités** incluses

3. Complétez le paiement (carte bancaire)

### Étape 3 : Récupérer votre clé API

1. Dans votre dashboard, allez dans **"API Keys"** ou **"My API Key"**
2. Vous verrez votre clé API (exemple : `abc123def456ghi789...`)
3. **Copiez cette clé** (vous en aurez besoin)

### Étape 4 : Configurer dans votre application

1. Ouvrez le fichier `.env` à la racine du projet
2. Ajoutez votre clé :

```env
# API-Football Plan Ultra (Dashboard)
API_FOOTBALL_KEY="votre-cle-api-football-ici"
```

3. **Redémarrez votre serveur** pour que les changements prennent effet

---

## 🔍 Vérification

### Tester votre clé

Une fois configurée, vous pouvez tester avec :

```bash
# Synchroniser les matchs
curl http://localhost:3000/api/sync?days=7
```

Si vous voyez des matchs synchronisés, c'est que ça fonctionne ! ✅

---

## 📊 Utilisation

### Endpoints disponibles

Une fois configuré, l'application utilise automatiquement API-Football pour :

- **Synchronisation des matchs** : `/api/sync`
- **Enrichissement** : `/api/enrich`
- **Prédictions** : `/api/predictions`

### Données récupérées

Avec le plan Ultra, vous avez accès à :
- ✅ Fixtures (matchs)
- ✅ Injuries (blessures)
- ✅ Lineups (compositions)
- ✅ Statistics (statistiques)
- ✅ Head-to-head (confrontations)
- ✅ Et bien plus...

---

## 🐛 Dépannage

### Erreur : "API_FOOTBALL_KEY non configurée"

**Solution** :
1. Vérifiez que la clé est dans `.env`
2. Vérifiez qu'il n'y a pas d'espaces avant/après la clé
3. Redémarrez le serveur

### Erreur : "401 Unauthorized"

**Solution** :
1. Vérifiez que votre clé est correcte
2. Vérifiez que votre abonnement est actif
3. Vérifiez sur le dashboard que la clé est valide

### Erreur : "429 Too Many Requests"

**Solution** :
- Avec 75 000 req/jour, cela ne devrait pas arriver
- Vérifiez votre usage sur le dashboard
- Attendez quelques minutes et réessayez

---

## 📝 Documentation

- **Documentation API** : https://www.api-football.com/documentation-v3
- **Dashboard** : https://dashboard.api-football.com
- **Support** : Via le dashboard (chat support)

---

## ✅ C'est tout !

Une fois votre clé configurée dans `.env`, l'application utilisera automatiquement API-Football pour toutes les données.

**Le code détecte automatiquement** que vous utilisez le dashboard et utilise le bon header d'authentification (`x-apisports-key`).

🎉 **Vous êtes prêt à générer des prédictions de niveau professionnel !**

