"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Zap, TrendingUp, BarChart3, LogOut, User, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Fonctionnalités", href: "/features" },
  { name: "Tarifs", href: "/pricing" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Football AI
                </span>
                <p className="text-xs text-muted-foreground">Predictor</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/dashboard" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/features"
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/features" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Fonctionnalités
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/pricing"
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      pathname === "/pricing" && "bg-accent text-accent-foreground"
                    )}
                  >
                    Tarifs
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline">{user.name || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || "Utilisateur"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Essai Gratuit</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              
              {/* Header avec logo */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Football AI
                  </span>
                  <p className="text-xs text-muted-foreground">Predictor</p>
                </div>
              </div>

              <nav className="flex flex-col h-full">
                {/* Navigation principale */}
                <div className="flex flex-col gap-1 px-4 py-4">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      pathname === "/dashboard"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/features"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      pathname === "/features"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <TrendingUp className="h-5 w-5" />
                    Fonctionnalités
                  </Link>
                  <Link
                    href="/pricing"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      pathname === "/pricing"
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="h-5 w-5" />
                    Tarifs
                  </Link>
                </div>

                {/* Section utilisateur */}
                <div className="mt-auto border-t pt-4 px-4 pb-6 space-y-3">
                  {loading ? (
                    <div className="h-12 bg-muted animate-pulse rounded-lg" />
                  ) : user ? (
                    <>
                      <div className="px-4 py-3 flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name || "Utilisateur"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" asChild className="w-full justify-start">
                          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                            <User className="mr-2 h-4 w-4" />
                            Mon Profil
                          </Link>
                        </Button>
                        <Button variant="destructive" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full justify-start">
                          <LogOut className="mr-2 h-4 w-4" />
                          Déconnexion
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Connexion
                        </Link>
                      </Button>
                      <Button asChild className="w-full bg-gradient-to-r from-primary to-primary/80">
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                          Essai Gratuit
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}

