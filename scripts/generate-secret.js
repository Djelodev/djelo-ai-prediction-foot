// Script pour générer NEXTAUTH_SECRET
const crypto = require('crypto')
const secret = crypto.randomBytes(32).toString('base64')
console.log('\n✅ NEXTAUTH_SECRET généré :\n')
console.log(secret)
console.log('\n📝 Ajoutez cette ligne dans votre fichier .env :\n')
console.log(`NEXTAUTH_SECRET="${secret}"\n`)

