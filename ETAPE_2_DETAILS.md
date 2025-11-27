# 📝 Étape 2 : Créer le fichier .env.local (Détails)

## 🎯 Objectif

Créer un fichier `.env.local` dans votre projet pour stocker temporairement la connection string PostgreSQL. Ce fichier permet à Prisma de se connecter à votre base Neon pour créer les tables.

## 📋 Instructions détaillées

### Étape 2.1 : Récupérer la connection string depuis Vercel

1. **Allez sur Vercel** : https://vercel.com
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** (djelo-ai-prediction-foot)
4. **Cliquez sur "Settings"** (en haut à droite)
5. **Cliquez sur "Environment Variables"** (dans le menu de gauche)
6. **Cherchez la variable `POSTGRES_URL`** dans la liste
7. **Cliquez sur la valeur** pour la révéler (ou sur l'icône 👁️)
8. **Copiez toute la valeur** (elle ressemble à : `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

### Étape 2.2 : Créer le fichier .env.local

**Option A : Via l'éditeur de code (VS Code, Cursor, etc.)**

1. **Ouvrez votre projet** dans votre éditeur
2. **À la racine du projet** (même niveau que `package.json`, `prisma/`, etc.)
3. **Créez un nouveau fichier** :
   - Clic droit → "New File"
   - Ou : `Ctrl+N` (Windows) / `Cmd+N` (Mac)
4. **Nommez-le exactement** : `.env.local`
   - ⚠️ Important : Le nom commence par un point (`.`)
   - ⚠️ Important : Pas d'extension (pas `.env.local.txt`)
5. **Collez cette ligne dans le fichier** :

```env
DATABASE_URL="collez-votre-connection-string-ici"
```

**Remplacez `collez-votre-connection-string-ici`** par la valeur que vous avez copiée depuis Vercel.

**Exemple de fichier `.env.local` complet :**

```env
DATABASE_URL="postgresql://user:password@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Étape 2.3 : Vérifier que le fichier est créé

1. **Dans votre explorateur de fichiers** (ou dans l'éditeur)
2. **À la racine du projet**, vous devriez voir :
   - `package.json`
   - `prisma/`
   - `.env.local` ← **Ce nouveau fichier**
   - `app/`
   - etc.

### Étape 2.4 : Vérifier que le fichier est ignoré par Git

Le fichier `.env.local` est déjà dans `.gitignore`, donc :
- ✅ Il ne sera **pas** commité sur GitHub
- ✅ Vos secrets restent **privés**
- ✅ C'est **sécurisé**

## 🎬 Exemple visuel

```
ai-football-predictor/
├── .env.local          ← Créez ce fichier ici
├── .gitignore
├── package.json
├── prisma/
│   └── schema.prisma
├── app/
└── ...
```

## ⚠️ Erreurs courantes

### ❌ "Je ne vois pas le fichier .env.local"

**Solution :**
- Les fichiers commençant par `.` sont parfois cachés
- Dans VS Code/Cursor : `Ctrl+Shift+P` → "Toggle Hidden Files"
- Ou créez-le directement avec le nom complet : `.env.local`

### ❌ "Le fichier s'appelle .env.local.txt"

**Solution :**
- Windows peut ajouter `.txt` automatiquement
- Renommez-le en `.env.local` (sans extension)
- Ou créez-le via la ligne de commande (voir Option B)

### ❌ "Je ne trouve pas POSTGRES_URL sur Vercel"

**Solution :**
1. Vérifiez que vous avez bien créé la base Neon
2. Allez dans **Storage** → vous devriez voir votre base Neon
3. Si elle n'existe pas, créez-la d'abord (voir `QUICK_FIX_NEON.md`)

## 🔄 Option B : Créer le fichier via la ligne de commande

Si vous préférez utiliser le terminal :

```bash
# Windows PowerShell
cd C:\Users\Dell\Desktop\ai-football-predictor
echo 'DATABASE_URL="votre-connection-string-ici"' > .env.local

# Windows CMD
cd C:\Users\Dell\Desktop\ai-football-predictor
echo DATABASE_URL="votre-connection-string-ici" > .env.local

# Mac/Linux
cd ~/Desktop/ai-football-predictor
echo 'DATABASE_URL="votre-connection-string-ici"' > .env.local
```

**Puis éditez le fichier** pour remplacer `votre-connection-string-ici` par la vraie valeur.

## ✅ Vérification finale

Votre fichier `.env.local` doit :
- ✅ Être à la racine du projet
- ✅ S'appeler exactement `.env.local` (avec le point au début)
- ✅ Contenir une seule ligne : `DATABASE_URL="postgresql://..."`
- ✅ La connection string doit être entre guillemets

## 🎯 Prochaine étape

Une fois le fichier `.env.local` créé, passez à l'**Étape 3** : Exécuter `pnpm prisma db push`

---

## 💡 Astuce

Si vous avez déjà un fichier `.env` dans votre projet, vous pouvez aussi ajouter la ligne `DATABASE_URL` dedans. Mais `.env.local` est préférable car il est déjà dans `.gitignore` et ne sera jamais commité.

