"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, ShieldCheck, Zap } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!token) {
      setError("Le lien de réinitialisation est invalide.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Impossible de réinitialiser le mot de passe.")
      }

      setSuccessMessage("Mot de passe mis à jour. Vous pouvez vous connecter.")
      setPassword("")
      setConfirmPassword("")

      setTimeout(() => {
        router.push("/login")
      }, 2500)
    } catch (err: any) {
      setError(err?.message || "Une erreur inattendue est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Réinitialiser le mot de passe</CardTitle>
              <CardDescription>
                Choisissez un nouveau mot de passe sécurisé pour votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!token ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  Le lien de réinitialisation est invalide ou incomplet. Veuillez refaire une demande.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 text-sm rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>{successMessage}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 text-sm">
              <p className="flex items-center justify-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                Le lien expire automatiquement pour votre sécurité.
              </p>
              <p className="text-center text-muted-foreground">
                Retour à{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  la connexion
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthGuard requireAuth={false} redirectTo="/dashboard">
          <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
            <Navbar />
            <div className="flex flex-1 items-center justify-center px-4 py-10">
              <Card className="w-full max-w-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AuthGuard>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

