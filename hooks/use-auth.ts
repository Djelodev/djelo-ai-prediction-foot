"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  image: string | null
  createdAt?: string | null
  plan?: string
  isActive?: boolean
  daysRemaining?: number
}

interface Session {
  user: User | null
  expires: string | null
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      })
      const data = await response.json()
      setSession(data)
    } catch (error) {
      console.error("Error fetching session:", error)
      setSession({ user: null, expires: null })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setSession({ user: null, expires: null })
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return {
    user: session?.user || null,
    loading,
    logout,
    refetch: fetchSession,
  }
}

