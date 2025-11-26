# ⚡ Déploiement Rapide sur Vercel

## 🚀 En 5 minutes

### 1. Préparer le code
```bash
# Vérifier que tout fonctionne
pnpm build
```

### 2. Pousser sur GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 3. Déployer sur Vercel
1. Allez sur https://vercel.com
2. **"Add New Project"**
3. Importez votre repo GitHub
4. **Configurez les variables d'environnement** (voir ci-dessous)
5. **"Deploy"**

### 4. Variables d'environnement sur Vercel

**Ajoutez ces variables dans Vercel (Settings → Environment Variables) :**

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://votre-app.vercel.app"  # Mettez à jour après le déploiement
NEXTAUTH_SECRET="[générez avec: openssl rand -base64 32]"
GROQ_API_KEY="votre-cle-groq"
API_FOOTBALL_KEY="votre-cle-api-football"
OPENWEATHER_API_KEY="votre-cle-openweather"
NEXT_PUBLIC_APP_URL="https://votre-app.vercel.app"  # Mettez à jour après le déploiement
```

**💡 Astuce :** Pour `NEXTAUTH_SECRET`, exécutez :
```bash
pnpm generate-secret
```

### 5. Après le premier déploiement

1. Copiez l'URL de votre app (ex: `https://ai-football-predictor.vercel.app`)
2. Mettez à jour sur Vercel :
   - `NEXTAUTH_URL` = votre URL
   - `NEXT_PUBLIC_APP_URL` = votre URL
3. Redéployez (automatique si vous avez activé "Redeploy on change")

---

## ✅ C'est tout !

Votre app est en ligne ! 🎉

**Guide complet :** Voir [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

