# ⚡ Correction Rapide : Passer à Neon PostgreSQL

## 🎯 Étapes en 5 minutes

### 1. Créer la base Neon sur Vercel

1. Vercel → votre projet → **"Storage"**
2. **"Create New"** → **"Neon"** → **"Serverless Postgres"**
3. Connectez-vous à Neon (créez un compte si nécessaire)
4. Choisissez la région et le plan **Free**
5. Cliquez sur **"Create Database"**

✅ Vercel créera automatiquement `POSTGRES_URL`

### 2. Configurer DATABASE_URL

1. Vercel → **Settings** → **Environment Variables**
2. Modifiez `DATABASE_URL` → valeur : `$POSTGRES_URL`
3. Sélectionnez **Production**, **Preview**, **Development**
4. **Save**

### 3. Mettre à jour Prisma

Le fichier `prisma/schema.prisma` a déjà été mis à jour pour PostgreSQL.

### 4. Pousser et déployer

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL (Neon)"
git push
```

Vercel redéploiera automatiquement et créera les tables.

### 5. Tester

1. Attendez que le déploiement se termine
2. Allez sur votre app Vercel
3. Essayez de créer un compte
4. ✅ Ça devrait fonctionner !

---

## 🔍 Si ça ne fonctionne pas

1. **Vérifiez les logs Vercel** :
   - Deployments → dernier déploiement → Functions → View Logs

2. **Vérifiez que DATABASE_URL est correcte** :
   - Settings → Environment Variables
   - Doit être : `$POSTGRES_URL`

3. **Vérifiez que les tables sont créées** :
   - Allez sur le dashboard Neon
   - Vérifiez que les tables existent

---

## 💡 Alternative : Supabase

Si Neon ne fonctionne pas, utilisez Supabase :

1. Vercel → Storage → **"Supabase"**
2. Connectez-vous à Supabase
3. Créez un projet
4. Copiez la connection string
5. Ajoutez-la comme `DATABASE_URL` sur Vercel

