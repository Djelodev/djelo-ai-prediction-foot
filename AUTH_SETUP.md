# 🔐 Guide d'Authentification avec NextAuth.js

## Pourquoi NextAuth.js ?

✅ **Gratuit et open-source**  
✅ **Spécialement conçu pour Next.js**  
✅ **Supporte Email, Google, GitHub, etc.**  
✅ **Facile à intégrer avec Prisma**  
✅ **Sécurisé par défaut**  

## Installation

```bash
pnpm add next-auth@beta
pnpm add @auth/prisma-adapter
```

## Configuration

### 1. Mettre à jour le schéma Prisma

Ajoutez les modèles User, Account, Session, VerificationToken dans `prisma/schema.prisma`

### 2. Variables d'environnement

Ajoutez dans `.env` :
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="générez-une-clé-secrète-ici"
```

### 3. Configuration NextAuth

Créez `app/api/auth/[...nextauth]/route.ts`

## Providers disponibles

- **Email/Password** : Authentification classique
- **Google OAuth** : Connexion avec Google (gratuit)
- **GitHub OAuth** : Connexion avec GitHub (gratuit)
- **Magic Link** : Connexion sans mot de passe

## Déploiement

NextAuth.js fonctionne parfaitement sur Vercel, Netlify, Railway, etc.

