"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck, ShieldCheck, Zap } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setDevResetLink(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Une erreur est survenue")
      }

      setSuccessMessage(
        data?.message ||
          "Si un compte existe avec cet email, nous venons d'envoyer un lien pour réinitialiser le mot de passe."
      )

      if (data?.resetUrl) {
        setDevResetLink(data.resetUrl)
      }

      setEmail("")
    } catch (err: any) {
      setError(err?.message || "Impossible de traiter la demande pour le moment.")
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
              <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
              <CardDescription>
                Entrez l&apos;adresse email de votre compte. Nous vous enverrons un lien sécurisé.
              </CardDescription>
            </CardHeader>
            <CardContent>
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer le lien"}
                </Button>
              </form>

              {devResetLink && (
                <div className="mt-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <MailCheck className="h-4 w-4 text-primary" />
                    Lien de test (mode développement)
                  </p>
                  <p className="mt-1 break-all">
                    <Link href={devResetLink} className="text-primary underline">
                      {devResetLink}
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 text-sm">
              <p className="text-center text-muted-foreground">
                Vous vous souvenez de votre mot de passe ?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Revenir à la connexion
                </Link>
              </p>
              <p className="text-center text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Commencer un essai
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}

