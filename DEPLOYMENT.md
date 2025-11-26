# 🚀 Guide de Déploiement

## Option 1 : Vercel (RECOMMANDÉ) ⭐

### Pourquoi Vercel ?
- ✅ **Gratuit** pour les projets personnels
- ✅ **Optimisé pour Next.js** (créé par l'équipe Next.js)
- ✅ **Déploiement automatique** depuis Git
- ✅ **Variables d'environnement** sécurisées
- ✅ **HTTPS automatique**
- ✅ **Base de données PostgreSQL gratuite** (optionnel)

### Étapes de déploiement

1. **Préparer le projet**
   ```bash
   # S'assurer que tout fonctionne en local
   pnpm build
   ```

2. **Pousser sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-username/votre-repo.git
   git push -u origin main
   ```

3. **Déployer sur Vercel**
   - Allez sur https://vercel.com
   - Connectez votre compte GitHub
   - Cliquez sur "New Project"
   - Importez votre repository
   - Configurez les variables d'environnement (voir ci-dessous)
   - Cliquez sur "Deploy"

4. **Variables d'environnement sur Vercel**
   ```
   DATABASE_URL=file:./dev.db  # Pour SQLite (ou PostgreSQL pour production)
   NEXTAUTH_URL=https://votre-app.vercel.app
   NEXTAUTH_SECRET=votre-secret-ici
   GROQ_API_KEY=votre-cle-groq
   API_FOOTBALL_KEY=votre-cle-api-football
   OPENWEATHER_API_KEY=votre-cle-openweather
   ```

5. **Base de données pour production**
   - Option 1 : **SQLite** (simple mais limité)
   - Option 2 : **PostgreSQL** (recommandé pour production)
     - Vercel Postgres (gratuit jusqu'à 256 MB)
     - Supabase (gratuit jusqu'à 500 MB)
     - Railway (gratuit avec limites)

---

## Option 2 : Netlify

### Avantages
- ✅ Gratuit
- ✅ Bon support Next.js
- ✅ Déploiement automatique

### Étapes
1. Créez un compte sur https://netlify.com
2. Connectez votre repo GitHub
3. Configurez le build :
   - Build command: `pnpm build`
   - Publish directory: `.next`
4. Ajoutez les variables d'environnement

---

## Option 3 : Railway

### Avantages
- ✅ Gratuit avec $5 de crédit/mois
- ✅ Base de données PostgreSQL incluse
- ✅ Déploiement simple

### Étapes
1. Créez un compte sur https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Ajoutez une base de données PostgreSQL
4. Configurez les variables d'environnement

---

## Option 4 : Render

### Avantages
- ✅ Gratuit avec limitations
- ✅ PostgreSQL gratuit

### Étapes
1. Créez un compte sur https://render.com
2. "New Web Service" → Connectez GitHub
3. Configurez le build et les variables

---

## Migration de SQLite vers PostgreSQL (Production)

### Pour Vercel + Supabase (Gratuit)

1. **Créer un projet Supabase**
   - https://supabase.com
   - Créez un nouveau projet
   - Récupérez la connection string

2. **Mettre à jour Prisma**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Migrer les données**
   ```bash
   pnpm prisma migrate dev --name init
   ```

4. **Mettre à jour DATABASE_URL sur Vercel**
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

---

## Configuration recommandée pour Production

### Variables d'environnement essentielles
```env
# Base de données
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://votre-app.vercel.app"
NEXTAUTH_SECRET="générez-avec: openssl rand -base64 32"

# APIs
GROQ_API_KEY="..."
API_FOOTBALL_KEY="..."
OPENWEATHER_API_KEY="..."

# Optionnel
GOOGLE_CLIENT_ID="..." # Pour OAuth Google
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..." # Pour OAuth GitHub
GITHUB_CLIENT_SECRET="..."
```

### Sécurité
- ✅ Utilisez HTTPS (automatique sur Vercel)
- ✅ Ne commitez jamais les `.env`
- ✅ Utilisez des secrets forts pour `NEXTAUTH_SECRET`
- ✅ Activez les rate limits sur les APIs

---

## Checklist de déploiement

- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées
- [ ] Base de données configurée (PostgreSQL recommandé)
- [ ] `pnpm build` fonctionne en local
- [ ] Tests effectués en local
- [ ] Documentation à jour
- [ ] Monitoring configuré (optionnel)

---

## Support

En cas de problème :
1. Vérifiez les logs sur Vercel/Netlify
2. Vérifiez les variables d'environnement
3. Testez en local avec les mêmes variables
4. Consultez la documentation Next.js : https://nextjs.org/docs/deployment

