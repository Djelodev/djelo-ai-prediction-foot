"use client"

import { useState, useEffect } from "react"

export function Header() {
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    // Mettre à jour l'heure uniquement côté client pour éviter l'erreur d'hydratation
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("fr-FR"))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000) // Mise à jour chaque seconde

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">⚽</div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Football AI Predictor</h1>
              <p className="text-xs text-muted-foreground">Analyse IA approfondie des grands championnats</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {currentTime && <p>Mise à jour: {currentTime}</p>}
            <p className="text-primary font-semibold">Prédictions en Temps Réel</p>
          </div>
        </div>
      </div>
    </header>
  )
}
