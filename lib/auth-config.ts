import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { compare } from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ NEXTAUTH_SECRET is not set. Authentication will not work.")
  // Ne pas throw ici pour permettre le build, mais logger l'erreur
}

if (!process.env.NEXTAUTH_URL) {
  console.warn("⚠️ NEXTAUTH_URL is not set. Using default: http://localhost:3000")
}

// Note: Don't use PrismaAdapter with CredentialsProvider + JWT strategy
// The adapter is only needed for OAuth providers with database sessions
const useOAuth = !!(
  (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
  (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
)

export const authOptions: NextAuthOptions = {
  // Only use adapter if OAuth providers are configured
  ...(useOAuth ? { adapter: PrismaAdapter(db) as any } : {}),
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorize called with credentials:", { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        })
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password")
          return null
        }

        try {
          const { email, password } = loginSchema.parse(credentials)
          console.log("✅ Credentials parsed successfully")
          
          // Find user by email
          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            console.log("❌ User not found:", email)
            return null
          }
          console.log("✅ User found:", user.id)

          // Check if user has a password (not OAuth user)
          const account = await db.account.findFirst({
            where: {
              userId: user.id,
              type: "credentials",
            },
          })

          if (!account) {
            console.log("❌ No credentials account found for user")
            return null
          }
          console.log("✅ Account found:", account.id)

          // Compare password with hashed password stored in access_token
          const hashedPassword = account.access_token || ""
          if (!hashedPassword) {
            console.log("❌ No hashed password in account")
            return null
          }
          
          const isValid = await compare(password, hashedPassword)
          console.log("🔐 Password validation:", isValid ? "✅ Valid" : "❌ Invalid")

          if (!isValid) {
            return null
          }

          const result = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
          console.log("✅ Returning user:", result)
          return result
        } catch (error: any) {
          console.error("❌ Auth error:", error)
          return null
        }
      },
    }),
    // Google OAuth (Optional - only add if credentials are provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // GitHub OAuth (Optional - only add if credentials are provided)
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // Redirect auth errors to login page
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("📝 JWT callback:", { hasUser: !!user, tokenSub: token.sub })
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      console.log("📝 Session callback:", { hasToken: !!token, tokenId: token.id })
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string || ""
        session.user.name = token.name as string || ""
        session.user.image = token.picture as string || ""
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Important pour Next.js 16
}

