"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Calendar, Award } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function ProfilePage() {
  const { user } = useAuth()
  
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez vos informations personnelles et consultez vos statistiques
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Informations Personnelles</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Mettez à jour vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "Avatar"} />
                    <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-primary to-primary/60">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || <User className="h-8 w-8 sm:h-10 sm:w-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold truncate">{user?.name || "Utilisateur"}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email || ""}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Changer la photo
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input 
                      id="name" 
                      placeholder="Votre nom complet" 
                      defaultValue={user?.name || ""}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="votre@email.com" 
                      defaultValue={user?.email || ""}
                      disabled
                      className="bg-muted w-full"
                    />
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                  </div>
                </div>

                <Button className="w-full sm:w-auto">
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-1">
            {/* Account Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl">Informations du Compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-xs sm:text-sm truncate">{user?.email || "Non défini"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Membre depuis</p>
                    <p className="font-medium text-xs sm:text-sm">
                      {user?.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString("fr-FR", { 
                            month: "long", 
                            year: "numeric" 
                          })
                        : "Date inconnue"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium text-xs sm:text-sm">Pro</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  )
}

