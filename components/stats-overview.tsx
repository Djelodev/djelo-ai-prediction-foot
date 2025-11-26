"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Target, Zap, BarChart3, Sparkles } from "lucide-react"

interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  league: string
  date: string
  hour: string
  homeForm: string
  awayForm: string
  homeStats: {
    goalsFor: number
    goalsAgainst: number
    wins: number
    draws: number
    losses: number
  }
  awayStats: {
    goalsFor: number
    goalsAgainst: number
    wins: number
    draws: number
    losses: number
  }
  prediction?: {
    prediction_1n2: string
    confidence_1n2: number
    predicted_score: string
    confidence_score: number
    btts: boolean
    confidence_btts: number
    over_under_2_5: string
    confidence_ou25: number
    analysis: string
  } | null
}

interface Props {
  matches: Match[]
}

export function StatsOverview({ matches }: Props) {
  const stats = useMemo(() => {
    if (matches.length === 0) return null

    const preds = matches.filter((m) => m.prediction).map((m) => m.prediction!)
    
    if (preds.length === 0) {
      return [
        { 
          label: "Matchs Analysés", 
          value: matches.length.toString(), 
          icon: BarChart3, 
          gradient: "from-primary/20 via-primary/10 to-primary/5",
          borderColor: "border-primary/30",
          textColor: "text-primary"
        },
        { 
          label: "Confiance Moyenne", 
          value: "N/A", 
          icon: Target, 
          gradient: "from-blue-500/20 via-blue-500/10 to-blue-500/5",
          borderColor: "border-blue-500/30",
          textColor: "text-blue-600 dark:text-blue-400"
        },
        { 
          label: "BTTS OUI", 
          value: "N/A", 
          icon: Zap, 
          gradient: "from-purple-500/20 via-purple-500/10 to-purple-500/5",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-600 dark:text-purple-400"
        },
        { 
          label: "Tendance OVER", 
          value: "N/A", 
          icon: TrendingUp, 
          gradient: "from-green-500/20 via-green-500/10 to-green-500/5",
          borderColor: "border-green-500/30",
          textColor: "text-green-600 dark:text-green-400"
        },
      ]
    }

    const avg1N2 = Math.round(preds.reduce((sum, p) => sum + p.confidence_1n2, 0) / preds.length)
    const avgScore = Math.round(preds.reduce((sum, p) => sum + p.confidence_score, 0) / preds.length)
    const avgBTTS = Math.round(preds.reduce((sum, p) => sum + p.confidence_btts, 0) / preds.length)
    const avgOU = Math.round(preds.reduce((sum, p) => sum + p.confidence_ou25, 0) / preds.length)
    const bttsYes = preds.filter((p) => p.btts).length
    const overCount = preds.filter((p) => p.over_under_2_5 === "OVER").length

    return [
      { 
        label: "Matchs Analysés", 
        value: matches.length.toString(), 
        icon: BarChart3, 
        gradient: "from-primary/20 via-primary/10 to-primary/5",
        borderColor: "border-primary/30",
        textColor: "text-primary"
      },
      { 
        label: "Confiance Moyenne", 
        value: `${avg1N2}%`, 
        icon: Target, 
        gradient: "from-blue-500/20 via-blue-500/10 to-blue-500/5",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-600 dark:text-blue-400"
      },
      {
        label: "BTTS OUI",
        value: `${bttsYes}/${preds.length}`,
        icon: Zap,
        gradient: "from-purple-500/20 via-purple-500/10 to-purple-500/5",
        borderColor: "border-purple-500/30",
        textColor: "text-purple-600 dark:text-purple-400"
      },
      {
        label: "Tendance OVER",
        value: `${overCount}/${preds.length}`,
        icon: TrendingUp,
        gradient: "from-green-500/20 via-green-500/10 to-green-500/5",
        borderColor: "border-green-500/30",
        textColor: "text-green-600 dark:text-green-400"
      },
    ]
  }, [matches])

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card 
            key={idx} 
            className={`relative overflow-hidden border-2 ${stat.borderColor} bg-gradient-to-br ${stat.gradient} backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group`}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-background/50 backdrop-blur-sm border ${stat.borderColor}`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={`text-3xl lg:text-4xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
