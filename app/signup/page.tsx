"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { AuthGuard } from "@/components/auth-guard"
import { Zap, Check } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue")
        return
      }

      // Rediriger vers la page de connexion
      router.push("/login?registered=true")
    } catch (error) {
      setError("Une erreur est survenue lors de la création du compte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
            <CardDescription>
              Commencez votre essai gratuit de 3 jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 6 caractères
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <input type="checkbox" id="terms" className="mt-1" required disabled={loading} />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  J'accepte les{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
            </form>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                <span>Essai gratuit de 3 jours</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                <span>Aucune carte bancaire requise</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                <span>Accès complet pendant l'essai</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
