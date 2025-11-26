# 🚀 Guide de Déploiement sur Vercel

## 📋 Prérequis

- ✅ Un compte GitHub (gratuit)
- ✅ Un compte Vercel (gratuit)
- ✅ Toutes vos clés API configurées

---

## 🎯 Étape 1 : Préparer le projet

### 1.1 Vérifier que le build fonctionne en local

```bash
# Installer les dépendances
pnpm install

# Générer Prisma Client
pnpm prisma generate

# Tester le build
pnpm build
```

Si le build échoue, corrigez les erreurs avant de continuer.

### 1.2 S'assurer que le code est prêt

- ✅ Tous les fichiers sont sauvegardés
- ✅ Pas d'erreurs TypeScript (`pnpm lint`)
- ✅ Le projet fonctionne en local (`pnpm dev`)

---

## 🎯 Étape 2 : Pousser sur GitHub

### 2.1 Initialiser Git (si pas déjà fait)

```bash
git init
git add .
git commit -m "Initial commit - Prêt pour Vercel"
```

### 2.2 Créer un repository sur GitHub

1. Allez sur https://github.com/new
2. Créez un nouveau repository (ex: `ai-football-predictor`)
3. **Ne cochez PAS** "Initialize with README" (vous avez déjà des fichiers)

### 2.3 Pousser le code

```bash
git remote add origin https://github.com/VOTRE-USERNAME/ai-football-predictor.git
git branch -M main
git push -u origin main
```

---

## 🎯 Étape 3 : Déployer sur Vercel

### 3.1 Créer un compte Vercel

1. Allez sur https://vercel.com
2. Cliquez sur **"Sign Up"**
3. Choisissez **"Continue with GitHub"** (recommandé)
4. Autorisez Vercel à accéder à vos repositories

### 3.2 Importer le projet

1. Dans le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Sélectionnez votre repository `ai-football-predictor`
3. Vercel détectera automatiquement Next.js

### 3.3 Configurer le projet

**Settings importants :**
- **Framework Preset** : Next.js (détecté automatiquement)
- **Root Directory** : `./` (par défaut)
- **Build Command** : `prisma generate && next build` (déjà dans `vercel.json`)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `pnpm install` (déjà dans `vercel.json`)

### 3.4 Ajouter les variables d'environnement

**⚠️ IMPORTANT :** Ajoutez toutes ces variables dans la section "Environment Variables" :

#### Variables REQUISES :

```env
# Base de données (SQLite pour débuter, PostgreSQL recommandé pour production)
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="https://votre-app.vercel.app"
NEXTAUTH_SECRET="générez-avec: openssl rand -base64 32"

# APIs
GROQ_API_KEY="votre-cle-groq"
API_FOOTBALL_KEY="votre-cle-api-football"
OPENWEATHER_API_KEY="votre-cle-openweather"

# URL de l'application
NEXT_PUBLIC_APP_URL="https://votre-app.vercel.app"
```

**Comment ajouter :**
1. Dans la section "Environment Variables"
2. Cliquez sur "Add" pour chaque variable
3. Entrez le nom et la valeur
4. Sélectionnez **"Production"**, **"Preview"**, et **"Development"** pour chaque variable

**💡 Astuce :** Pour `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL`, vous pouvez utiliser la variable automatique `$VERCEL_URL` ou attendre d'avoir l'URL finale.

### 3.5 Générer NEXTAUTH_SECRET

**Option 1 : En ligne de commande**
```bash
openssl rand -base64 32
```

**Option 2 : Avec le script du projet**
```bash
pnpm generate-secret
```

Copiez le résultat et collez-le dans `NEXTAUTH_SECRET` sur Vercel.

### 3.6 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes que le build se termine
3. Vercel vous donnera une URL (ex: `https://ai-football-predictor.vercel.app`)

---

## 🎯 Étape 4 : Configurer la base de données

### Option A : SQLite (Simple mais limité)

SQLite fonctionne sur Vercel mais avec des limitations :
- ❌ Les données ne persistent pas entre les redéploiements
- ❌ Pas adapté pour la production

**Pour tester rapidement :**
- Utilisez `DATABASE_URL="file:./dev.db"` (déjà configuré)

### Option B : PostgreSQL (RECOMMANDÉ pour production)

#### Option B1 : Vercel Postgres (Gratuit)

1. Dans votre projet Vercel, allez dans **"Storage"**
2. Cliquez sur **"Create Database"** → **"Postgres"**
3. Vercel créera automatiquement une base de données
4. Une variable `POSTGRES_URL` sera automatiquement ajoutée
5. Mettez à jour `DATABASE_URL` pour utiliser `POSTGRES_URL` :

```env
DATABASE_URL="$POSTGRES_URL"
```

#### Option B2 : Supabase (Gratuit jusqu'à 500 MB)

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans **Settings** → **Database**
4. Copiez la **Connection String** (URI)
5. Ajoutez-la comme `DATABASE_URL` sur Vercel

**Mettre à jour Prisma pour PostgreSQL :**

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Au lieu de "sqlite"
  url      = env("DATABASE_URL")
}
```

Puis poussez les changements :

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL"
git push
```

Vercel redéploiera automatiquement.

---

## 🎯 Étape 5 : Migrer les données (si vous avez déjà des données)

Si vous avez des données en local et que vous passez à PostgreSQL :

1. **Exporter les données SQLite** (optionnel)
2. **Créer les tables sur PostgreSQL** :
   - Vercel exécutera automatiquement `prisma generate` et créera les tables
   - Ou manuellement : `pnpm prisma db push` (en local avec la nouvelle DATABASE_URL)

---

## 🎯 Étape 6 : Mettre à jour les URLs

Après le déploiement, mettez à jour ces variables sur Vercel avec votre URL finale :

```env
NEXTAUTH_URL="https://votre-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://votre-app.vercel.app"
```

Puis **redéployez** (Vercel le fera automatiquement si vous avez activé "Redeploy on change").

---

## ✅ Checklist de déploiement

- [ ] Code poussé sur GitHub
- [ ] Projet importé sur Vercel
- [ ] Toutes les variables d'environnement ajoutées
- [ ] `NEXTAUTH_SECRET` généré et configuré
- [ ] Base de données configurée (PostgreSQL recommandé)
- [ ] Build réussi sur Vercel
- [ ] Application accessible via l'URL Vercel
- [ ] Test de connexion/inscription fonctionne
- [ ] Test de réinitialisation de mot de passe fonctionne

---

## 🔧 Résolution de problèmes

### Erreur : "Build failed"

**Vérifiez :**
1. Les logs de build sur Vercel (onglet "Deployments" → cliquez sur le build)
2. Que toutes les variables d'environnement sont définies
3. Que `pnpm build` fonctionne en local

### Erreur : "Prisma Client not generated"

**Solution :**
- Vercel devrait exécuter `prisma generate` automatiquement (configuré dans `vercel.json`)
- Si ça ne fonctionne pas, ajoutez dans "Build Command" : `prisma generate && next build`

### Erreur : "DATABASE_URL not found"

**Solution :**
- Vérifiez que `DATABASE_URL` est bien ajouté dans les variables d'environnement
- Vérifiez qu'elle est disponible pour "Production", "Preview", et "Development"

### Erreur : "NEXTAUTH_SECRET not set"

**Solution :**
- Générez un secret avec `openssl rand -base64 32`
- Ajoutez-le dans les variables d'environnement Vercel

### L'application fonctionne mais les données ne persistent pas

**Solution :**
- SQLite sur Vercel ne persiste pas entre les redéploiements
- Passez à PostgreSQL (Vercel Postgres ou Supabase)

---

## 🚀 Déploiements automatiques

Vercel déploie automatiquement :
- ✅ À chaque push sur `main` → **Production**
- ✅ À chaque pull request → **Preview** (URL temporaire)

Vous pouvez désactiver cela dans les settings du projet.

---

## 📊 Monitoring

Vercel fournit gratuitement :
- ✅ Logs en temps réel
- ✅ Analytics de performance
- ✅ Analytics de trafic (avec upgrade)

Accédez-y via le dashboard Vercel → votre projet → onglets "Deployments", "Analytics", etc.

---

## 🔒 Sécurité

- ✅ HTTPS automatique (gratuit)
- ✅ Variables d'environnement sécurisées (non visibles dans le code)
- ✅ Protection DDoS basique incluse

---

## 💰 Coûts

**Plan Gratuit Vercel :**
- ✅ 100 GB de bande passante/mois
- ✅ Déploiements illimités
- ✅ Domaine `.vercel.app` gratuit
- ✅ SSL/HTTPS gratuit
- ✅ Vercel Postgres : 256 MB gratuit

**Limites du plan gratuit :**
- ⚠️ 100 secondes de build time par déploiement
- ⚠️ Fonctions serverless : 100 GB-heures/mois

Pour la plupart des projets, c'est largement suffisant !

---

## 🎉 Félicitations !

Votre application est maintenant en ligne ! 🚀

**Prochaines étapes :**
1. Testez toutes les fonctionnalités
2. Configurez un domaine personnalisé (optionnel, dans Settings → Domains)
3. Activez les analytics (optionnel)
4. Configurez les webhooks pour les mises à jour automatiques

---

## 📞 Support

- **Documentation Vercel** : https://vercel.com/docs
- **Documentation Next.js** : https://nextjs.org/docs/deployment
- **Logs Vercel** : Dashboard → votre projet → Deployments → cliquez sur un déploiement

