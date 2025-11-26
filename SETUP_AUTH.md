# 🔐 Guide d'Installation de l'Authentification

## Installation des dépendances

```bash
pnpm install next-auth@beta @auth/prisma-adapter bcryptjs
pnpm install -D @types/bcryptjs
```

## Configuration

### 1. Mettre à jour la base de données

```bash
pnpm prisma db push
```

### 2. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="générez-une-clé-secrète-ici"

# Optionnel - OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### 3. Générer NEXTAUTH_SECRET

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Utilisation

### Connexion
- Allez sur `/login`
- Entrez email et mot de passe
- Cliquez sur "Se connecter"

### Inscription
- Allez sur `/signup`
- Remplissez le formulaire
- Créez votre compte

### Protection des routes

Pour protéger une route, utilisez :

```typescript
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  return <div>Contenu protégé</div>
}
```

## OAuth (Optionnel)

### Google OAuth
1. Allez sur https://console.cloud.google.com
2. Créez un projet
3. Activez Google+ API
4. Créez des identifiants OAuth 2.0
5. Ajoutez les clés dans `.env`

### GitHub OAuth
1. Allez sur https://github.com/settings/developers
2. Créez une nouvelle OAuth App
3. Ajoutez les clés dans `.env`

## Déploiement

Sur Vercel, ajoutez les variables d'environnement dans les paramètres du projet.

