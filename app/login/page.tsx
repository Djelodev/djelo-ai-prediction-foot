"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { AuthGuard } from "@/components/auth-guard"
import { Zap } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Vérifier s'il y a un message d'erreur dans l'URL
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError("Erreur d'authentification. Veuillez réessayer.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setError("")
    setLoading(true)

    try {
      console.log("🔐 Attempting custom login with:", email)
      
      // Use custom login endpoint instead of NextAuth signIn
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("🔐 Login response:", data)

      if (!response.ok) {
        setError(data.error || "Erreur de connexion")
        setLoading(false)
        return
      }

      if (data.success) {
        console.log("🔐 Login successful, redirecting...")
        // Refresh the page to update session
        window.location.href = "/dashboard"
        return
      }
      
      setError("Une erreur inattendue est survenue")
      setLoading(false)
    } catch (error: any) {
      console.error("🔐 Login catch error:", error?.message || error)
      setError("Erreur de connexion au serveur")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
            <CardDescription>
              Connectez-vous à votre compte pour accéder au dashboard
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="text-primary hover:underline font-semibold">
                Créer un compte
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </AuthGuard>
  )
}
