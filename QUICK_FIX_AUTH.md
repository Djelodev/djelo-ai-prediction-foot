# 🔧 Correction Rapide - Erreur NextAuth

## Problème
```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

## Solution

### 1. Vérifier que NEXTAUTH_SECRET est défini

Ajoutez dans votre fichier `.env` :

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-ici"
```

### 2. Générer un secret sécurisé

**Sur Windows (PowerShell) :**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Sur Linux/Mac :**
```bash
openssl rand -base64 32
```

### 3. Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
pnpm dev
```

### 4. Vérifier que la base de données est à jour

```bash
pnpm prisma db push
```

## Si l'erreur persiste

1. Vérifiez les logs du serveur pour voir l'erreur exacte
2. Assurez-vous que toutes les dépendances sont installées :
   ```bash
   pnpm install
   ```
3. Videz le cache Next.js :
   ```bash
   rm -rf .next
   # Sur Windows PowerShell :
   Remove-Item -Recurse -Force .next
   ```

## Test

1. Allez sur `/login`
2. Essayez de vous connecter (ou créez un compte sur `/signup`)

