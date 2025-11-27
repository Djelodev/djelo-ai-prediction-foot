# 🗄️ Créer les tables PostgreSQL sur Vercel

## 🚨 Problème

L'erreur `The table public.User does not exist` signifie que les tables n'ont pas encore été créées dans votre base de données PostgreSQL.

## ✅ Solution : Créer les tables

### Méthode 1 : Via Prisma en local (RECOMMANDÉ)

#### Étape 1 : Récupérer DATABASE_URL depuis Vercel

1. Allez sur Vercel → votre projet → **Settings** → **Environment Variables**
2. Trouvez `POSTGRES_URL` ou `DATABASE_URL`
3. Copiez la valeur (c'est votre connection string PostgreSQL)

#### Étape 2 : Créer un fichier .env.local

Créez un fichier `.env.local` à la racine du projet :

```env
DATABASE_URL="votre-connection-string-postgresql-ici"
```

**⚠️ Important :** Ne commitez JAMAIS ce fichier (il est déjà dans `.gitignore`)

#### Étape 3 : Créer les tables

Exécutez cette commande en local :

```bash
pnpm prisma db push
```

Cette commande va :
- Se connecter à votre base PostgreSQL Neon
- Créer toutes les tables définies dans `prisma/schema.prisma`
- Synchroniser le schema

#### Étape 4 : Vérifier

Vous devriez voir :
```
✔ Generated Prisma Client
✔ Database synchronized
```

#### Étape 5 : Tester

1. Allez sur votre app Vercel
2. Essayez de créer un compte
3. ✅ Ça devrait fonctionner maintenant !

---

### Méthode 2 : Via Prisma Studio (Optionnel)

Pour visualiser votre base de données :

```bash
pnpm prisma studio
```

Cela ouvrira Prisma Studio dans votre navigateur où vous pourrez voir toutes les tables.

---

### Méthode 3 : Via Neon Dashboard

1. Allez sur https://console.neon.tech
2. Connectez-vous
3. Sélectionnez votre projet
4. Allez dans **"SQL Editor"**
5. Vous pouvez exécuter des requêtes SQL directement

**Mais** : Il est plus simple d'utiliser `prisma db push` qui créera automatiquement toutes les tables.

---

## 🔍 Vérifier que les tables existent

### Via Prisma Studio

```bash
pnpm prisma studio
```

Vous devriez voir toutes les tables :
- User
- Account
- Session
- Team
- Match
- Prediction
- etc.

### Via SQL direct (Neon Dashboard)

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🆘 Si ça ne fonctionne toujours pas

### Vérifier la connection string

1. Vérifiez que `DATABASE_URL` sur Vercel pointe bien vers `$POSTGRES_URL`
2. Vérifiez que la connection string est correcte (pas d'espaces, pas de caractères spéciaux)

### Vérifier les logs

1. Vercel → Deployments → dernier déploiement → Functions → Logs
2. Cherchez les erreurs de connexion à la base de données

### Réessayer la création des tables

```bash
# Supprimer et recréer (ATTENTION : supprime les données)
pnpm prisma migrate reset

# Ou simplement push à nouveau
pnpm prisma db push
```

---

## ✅ Checklist

- [ ] `DATABASE_URL` configurée sur Vercel avec `$POSTGRES_URL`
- [ ] `.env.local` créé avec la connection string PostgreSQL
- [ ] `pnpm prisma db push` exécuté avec succès
- [ ] Tables créées (vérifiées via Prisma Studio)
- [ ] Test de création de compte réussi sur Vercel

---

## 💡 Astuce

Après avoir créé les tables, vous pouvez supprimer `.env.local` si vous voulez (les tables sont déjà créées sur Neon).

