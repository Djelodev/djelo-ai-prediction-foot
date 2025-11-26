# 🔍 Vérification des Variables d'Environnement

## Variables REQUISES pour NextAuth

Vérifiez que votre fichier `.env` contient au minimum :

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-ici"
```

## Générer NEXTAUTH_SECRET

Si vous n'avez pas de secret, exécutez :

```bash
pnpm generate-secret
```

Puis copiez le secret généré dans votre `.env`.

## Vérification

1. Vérifiez que le fichier `.env` existe à la racine du projet
2. Vérifiez que `NEXTAUTH_SECRET` n'est pas vide
3. Redémarrez le serveur après modification du `.env`

## Test

Après configuration, testez :
- `/signup` - Créer un compte
- `/login` - Se connecter

Si vous avez toujours l'erreur "Unexpected end of JSON input", vérifiez les logs du serveur pour voir l'erreur exacte.

