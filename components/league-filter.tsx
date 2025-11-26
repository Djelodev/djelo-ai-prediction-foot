"use client"

import { useState } from "react"
import type { LeagueFilter as LeagueFilterType } from "@/lib/types"

const LEAGUES: LeagueFilterType[] = [
  { id: "ucc", name: "Champions League", country: "Europe", selected: true },
  { id: "uel", name: "Europa League", country: "Europe", selected: true },
  { id: "pl", name: "Premier League", country: "England", selected: true },
  { id: "l1", name: "Ligue 1", country: "France", selected: true },
  { id: "ll", name: "La Liga", country: "Spain", selected: true },
  { id: "sa", name: "Serie A", country: "Italy", selected: true },
  { id: "bund", name: "Bundesliga", country: "Germany", selected: true },
]

interface Props {
  onFilterChange: (selected: string[]) => void
}

export function LeagueFilterComponent({ onFilterChange }: Props) {
  const [filters, setFilters] = useState<LeagueFilterType[]>(LEAGUES)

  const handleToggle = (id: string) => {
    const updated = filters.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    setFilters(updated)
    onFilterChange(updated.filter((f) => f.selected).map((f) => f.id))
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-semibold text-card-foreground">Filter by League</h2>
      <div className="flex flex-wrap gap-2">
        {filters.map((league) => (
          <button
            key={league.id}
            onClick={() => handleToggle(league.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              league.selected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {league.name}
          </button>
        ))}
      </div>
    </div>
  )
}
