# 🔐 Variables d'Environnement Requises

Copiez ce fichier et créez un `.env` local, puis ajoutez ces mêmes variables sur Vercel.

## Variables REQUISES

```env
# Base de données
# Pour SQLite (développement local)
DATABASE_URL="file:./dev.db"
# Pour PostgreSQL (production Vercel)
# DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth.js - REQUIS
NEXTAUTH_URL="http://localhost:3000"
# En production sur Vercel, utilisez votre URL : https://votre-app.vercel.app
NEXTAUTH_SECRET="générez-une-clé-secrète-avec-le-script-generate-secret"

# API Football (API-Football Ultra)
# Obtenez votre clé sur https://www.api-football.com/documentation-v3
API_FOOTBALL_KEY="votre-cle-api-football-ici"

# Groq AI (GRATUIT)
# Obtenez votre clé sur https://console.groq.com/
GROQ_API_KEY="votre-cle-groq-ici"

# OpenWeatherMap (GRATUIT - Pour la météo)
# Obtenez votre clé sur https://openweathermap.org/api
OPENWEATHER_API_KEY="votre-cle-openweather-ici"

# URL de l'application (pour les liens de reset password)
# En production, sera automatiquement défini par Vercel
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# En production : https://votre-app.vercel.app

# Paystack (paiement)
PAYSTACK_SECRET_KEY="sk_test_votre-cle-paystack"
# Devise utilisée par défaut côté passerelle (USD conseillé si activé sur Paystack)
# Renseignez XOF, NGN, etc. si votre compte Paystack n'accepte pas USD.
PAYSTACK_CURRENCY="USD"
# Taux de conversion USD -> devise Paystack pour calculer les montants de secours
# (Utilisé uniquement si vous ne définissez pas manuellement les montants ci-dessous)
PAYSTACK_USD_EXCHANGE_RATE="600"
# Optionnel : override du montant (en plus petite unité, exemple cents pour USD, kobo pour NGN, francs pour XOF)
# PAYSTACK_PLAN_PRO_AMOUNT="1900"      # 19,00 USD ou équivalent minor unit
# PAYSTACK_PLAN_PRO_MAX_AMOUNT="2900"  # 29,00 USD ou équivalent minor unit
```

## Variables OPTIONNELLES

```env
# OAuth Google (optionnel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OAuth GitHub (optionnel)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Comment obtenir les clés API

### 1. NEXTAUTH_SECRET
```bash
# Option 1 : Avec le script du projet
pnpm generate-secret

# Option 2 : En ligne de commande
openssl rand -base64 32
```

### 2. GROQ_API_KEY
1. Allez sur https://console.groq.com/
2. Créez un compte (gratuit)
3. Créez une API key
4. Copiez-la dans `GROQ_API_KEY`

### 3. API_FOOTBALL_KEY
1. Allez sur https://www.api-football.com/documentation-v3
2. Créez un compte et choisissez le plan "Ultra"
3. Récupérez votre clé API
4. Copiez-la dans `API_FOOTBALL_KEY`

### 4. OPENWEATHER_API_KEY
1. Allez sur https://openweathermap.org/api
2. Créez un compte gratuit
3. Récupérez votre API key
4. Copiez-la dans `OPENWEATHER_API_KEY`

### 5. PAYSTACK_SECRET_KEY
1. Connectez-vous à https://dashboard.paystack.com/
2. Allez dans **Settings → Developer** pour récupérer la clé secrète (`sk_test_...` ou `sk_live_...`)
3. Copiez la clé dans `PAYSTACK_SECRET_KEY`
4. Définissez également `PAYSTACK_CURRENCY` (USD par défaut), `PAYSTACK_USD_EXCHANGE_RATE` si vous facturez dans une autre devise, et, si besoin, `PAYSTACK_PLAN_PRO_AMOUNT` / `PAYSTACK_PLAN_PRO_MAX_AMOUNT` (en plus petite unité)

## Configuration sur Vercel

1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez chaque variable une par une
4. Sélectionnez **Production**, **Preview**, et **Development** pour chaque variable
5. Cliquez sur "Save"

**⚠️ Important :** 
- `NEXTAUTH_URL` doit être mis à jour avec votre URL Vercel après le premier déploiement
- `NEXT_PUBLIC_APP_URL` doit aussi être mis à jour avec votre URL Vercel

