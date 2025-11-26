import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-config"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Create and export handler
const { handlers } = NextAuth(authOptions)
export const { GET, POST } = handlers

