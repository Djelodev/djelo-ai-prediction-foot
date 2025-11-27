"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Globe, Shield, CreditCard, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [language, setLanguage] = useState("fr")
  const [timezone, setTimezone] = useState("europe/paris")
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [predictionReady, setPredictionReady] = useState(true)
  const [matchUpdates, setMatchUpdates] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implémenter la sauvegarde des paramètres
    setTimeout(() => {
      setSaving(false)
      // Afficher un message de succès
    }, 1000)
  }

  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
            <CardDescription>
              Configurez vos préférences d'affichage et de langue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input 
                id="name" 
                placeholder="Votre nom complet" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="votre@email.com" 
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Sélectionner un fuseau horaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="europe/paris">Europe/Paris (UTC+1)</SelectItem>
                  <SelectItem value="europe/london">Europe/London (UTC+0)</SelectItem>
                  <SelectItem value="america/new_york">America/New York (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Mode sombre</Label>
                <p className="text-sm text-muted-foreground">
                  Activer le thème sombre
                </p>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications par email
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="prediction-ready">Prédictions prêtes</Label>
                <p className="text-sm text-muted-foreground">
                  Notifier quand les prédictions sont disponibles
                </p>
              </div>
              <Switch 
                id="prediction-ready" 
                checked={predictionReady}
                onCheckedChange={setPredictionReady}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="match-updates">Mises à jour de matchs</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications sur les matchs suivis
                </p>
              </div>
              <Switch 
                id="match-updates" 
                checked={matchUpdates}
                onCheckedChange={setMatchUpdates}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité du Compte
            </CardTitle>
            <CardDescription>
              Gérez la sécurité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input id="current-password" type="password" placeholder="Entrez votre mot de passe actuel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input id="new-password" type="password" placeholder="Entrez votre nouveau mot de passe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input id="confirm-password" type="password" placeholder="Confirmez votre nouveau mot de passe" />
            </div>

            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Changer le mot de passe
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Gérez votre abonnement et facturation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {user?.plan === "trial"
                      ? "Essai Gratuit"
                      : user?.plan === "pro"
                      ? "Plan Pro"
                      : user?.plan === "pro_max" || user?.plan === "enterprise"
                      ? "Plan Pro Max"
                      : "Plan Gratuit"}
                  </p>
                  {user?.plan === "trial" && user?.daysRemaining !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      {user.daysRemaining} jour{user.daysRemaining > 1 ? "s" : ""} restant{user.daysRemaining > 1 ? "s" : ""}
                    </p>
                  )}
                  {user?.plan === "pro" && (
                    <p className="text-sm text-muted-foreground">19$/mois</p>
                  )}
                  {(user?.plan === "pro_max" || user?.plan === "enterprise") && (
                    <p className="text-sm text-muted-foreground">29$/mois</p>
                  )}
                  {user?.plan === "free" && (
                    <p className="text-sm text-muted-foreground">Gratuit</p>
                  )}
                </div>
                {user?.plan !== "pro" && user?.plan !== "pro_max" && user?.plan !== "enterprise" && (
                  <Button variant="outline" asChild>
                    <Link href="/pricing">Mettre à niveau</Link>
                  </Button>
                )}
                {(user?.plan === "pro" || user?.plan === "pro_max" || user?.plan === "enterprise") && (
                  <Button variant="outline">Gérer l'abonnement</Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Méthode de paiement</Label>
              <p className="text-sm text-muted-foreground">Aucune carte enregistrée</p>
            </div>

            <Button variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Ajouter une carte
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}

