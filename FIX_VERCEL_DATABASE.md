# 🔧 Correction : Erreur de création de compte sur Vercel

## 🚨 Problème

L'erreur "Erreur lors de la création du compte" sur Vercel est causée par **SQLite qui ne fonctionne pas sur Vercel**.

**Pourquoi ?**
- SQLite nécessite un système de fichiers persistant
- Vercel utilise un système de fichiers en lecture seule pour les fonctions serverless
- Les fichiers SQLite ne persistent pas entre les redéploiements

## ✅ Solution : Passer à PostgreSQL

### Option 1 : Neon (RECOMMANDÉ - Gratuit et Serverless) ⭐

**Neon est la meilleure option pour Vercel :**
- ✅ Serverless Postgres (parfait pour Vercel)
- ✅ Plan gratuit généreux
- ✅ Configuration en 2 minutes
- ✅ Compatible avec Prisma

#### Étape 1 : Créer la base de données Neon

1. Dans Vercel → votre projet → onglet **"Storage"**
2. Cliquez sur **"Create New"**
3. Sélectionnez **"Neon"** → **"Serverless Postgres"**
4. Cliquez sur **"Create"**
5. Neon vous demandera de vous connecter (créez un compte si nécessaire)
6. Choisissez :
   - **Region** : La région la plus proche de vos utilisateurs
   - **Plan** : Free (gratuit)
7. Cliquez sur **"Create Database"**

Vercel créera automatiquement :
- Une base de données PostgreSQL Neon
- Une variable d'environnement `POSTGRES_URL` (automatiquement ajoutée)

#### Étape 2 : Mettre à jour DATABASE_URL

1. Allez dans **Settings** → **Environment Variables**
2. Trouvez `DATABASE_URL` (ou créez-la si elle n'existe pas)
3. Mettez la valeur à : `$POSTGRES_URL`
4. Sélectionnez **Production**, **Preview**, et **Development**
5. Cliquez sur **"Save"**

#### Étape 3 : Mettre à jour Prisma pour PostgreSQL

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changez de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Étape 4 : Pousser les changements

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL (Neon)"
git push
```

Vercel redéploiera automatiquement.

#### Étape 5 : Créer les tables

Après le redéploiement, Vercel exécutera automatiquement `prisma generate` et créera les tables.

**OU** manuellement en local (optionnel) :

```bash
# Récupérer les variables d'environnement
vercel env pull .env.local

# Créer les tables
pnpm prisma db push
```

---

### Option 2 : Supabase (Gratuit jusqu'à 500 MB)

#### Étape 1 : Créer la base de données

1. Allez sur votre projet Vercel
2. Cliquez sur l'onglet **"Storage"**
3. Cliquez sur **"Create Database"**
4. Sélectionnez **"Postgres"**
5. Choisissez le plan **"Hobby"** (gratuit)
6. Cliquez sur **"Create"**

Vercel créera automatiquement :
- Une base de données PostgreSQL
- Une variable d'environnement `POSTGRES_URL` (automatiquement ajoutée)

#### Étape 2 : Mettre à jour DATABASE_URL

1. Allez dans **Settings** → **Environment Variables**
2. Trouvez `DATABASE_URL` (ou créez-la si elle n'existe pas)
3. Mettez la valeur à : `$POSTGRES_URL`
4. Cliquez sur **"Save"**

#### Étape 3 : Mettre à jour Prisma pour PostgreSQL

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changez de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Étape 4 : Pousser les changements

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for Vercel"
git push
```

Vercel redéploiera automatiquement.

#### Étape 5 : Créer les tables

Après le redéploiement, Vercel exécutera automatiquement `prisma generate` et créera les tables.

**OU** manuellement via Vercel CLI (optionnel) :

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Push le schema
vercel env pull .env.local
pnpm prisma db push
```

---

### Option 2 : Supabase (Gratuit jusqu'à 500 MB)

#### Étape 1 : Créer un projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte (gratuit)
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `ai-football-predictor` (ou autre)
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Choisissez la région la plus proche
5. Cliquez sur **"Create new project"**
6. Attendez 2-3 minutes que le projet soit créé

#### Étape 2 : Récupérer la connection string

1. Dans votre projet Supabase, allez dans **Settings** → **Database**
2. Faites défiler jusqu'à **"Connection string"**
3. Sélectionnez **"URI"**
4. Copiez la connection string (elle ressemble à : `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

#### Étape 3 : Ajouter DATABASE_URL sur Vercel

1. Allez sur Vercel → votre projet → **Settings** → **Environment Variables**
2. Ajoutez ou modifiez `DATABASE_URL`
3. Collez la connection string de Supabase
4. **Remplacez `[YOUR-PASSWORD]`** par le mot de passe que vous avez choisi lors de la création du projet
5. Sélectionnez **Production**, **Preview**, et **Development**
6. Cliquez sur **"Save"**

#### Étape 4 : Mettre à jour Prisma

Même chose que l'Option 1, Étape 3 :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Étape 5 : Pousser et déployer

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL (Supabase)"
git push
```

#### Étape 6 : Créer les tables

Après le redéploiement, les tables seront créées automatiquement.

**OU** manuellement via Supabase SQL Editor :

1. Allez dans Supabase → votre projet → **SQL Editor**
2. Exécutez `pnpm prisma db push` en local avec la nouvelle `DATABASE_URL`

---

## 🔍 Vérifier les logs Vercel

Pour voir l'erreur exacte :

1. Allez sur Vercel → votre projet
2. Cliquez sur l'onglet **"Deployments"**
3. Cliquez sur le dernier déploiement
4. Cliquez sur **"Functions"** → **"View Function Logs"**
5. Essayez de créer un compte et regardez les logs en temps réel

Les erreurs courantes sont :
- `Can't write to database file` → SQLite ne fonctionne pas
- `DATABASE_URL not found` → Variable d'environnement manquante
- `Connection refused` → URL de base de données incorrecte

---

## ✅ Checklist de migration

- [ ] Base de données PostgreSQL créée (Vercel Postgres ou Supabase)
- [ ] `DATABASE_URL` configurée sur Vercel
- [ ] `prisma/schema.prisma` mis à jour (`provider = "postgresql"`)
- [ ] Changements poussés sur GitHub
- [ ] Vercel redéployé automatiquement
- [ ] Tables créées dans PostgreSQL
- [ ] Test de création de compte réussi

---

## 🧪 Tester après migration

1. Allez sur votre application Vercel
2. Essayez de créer un compte
3. Si ça fonctionne, vous verrez "Compte créé avec succès"
4. Essayez de vous connecter avec ce compte

---

## 💡 Astuce

Si vous avez déjà des données en local (SQLite), vous pouvez les migrer vers PostgreSQL :

1. Exportez les données SQLite (optionnel)
2. Après avoir créé les tables PostgreSQL, importez les données manuellement si nécessaire

---

## 🆘 Besoin d'aide ?

Si le problème persiste après avoir migré vers PostgreSQL :

1. Vérifiez les logs Vercel (voir section ci-dessus)
2. Vérifiez que toutes les variables d'environnement sont correctes
3. Vérifiez que `NEXTAUTH_SECRET` est bien configuré
4. Vérifiez que la connection string PostgreSQL est correcte

