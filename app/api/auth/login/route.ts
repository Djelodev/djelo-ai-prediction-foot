import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"
import { z } from "zod"
import { SignJWT } from "jose"
import { cookies } from "next/headers"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔐 Custom login called with:", body.email)
    
    const { email, password } = loginSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("❌ User not found:", email)
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      )
    }
    console.log("✅ User found:", user.id)

    // Check if user has a password
    const account = await db.account.findFirst({
      where: {
        userId: user.id,
        type: "credentials",
      },
    })

    if (!account) {
      console.log("❌ No credentials account found")
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      )
    }

    const hashedPassword = account.access_token || ""
    if (!hashedPassword) {
      console.log("❌ No hashed password")
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      )
    }

    const isValid = await compare(password, hashedPassword)
    console.log("🔐 Password validation:", isValid)

    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      )
    }

    // Check subscription status
    const now = new Date()
    const isTrial = user.plan === "trial" && user.trialEnd && user.trialEnd > now
    const isActive = user.isActive && (isTrial || (user.subscriptionEnd && user.subscriptionEnd > now))
    
    let daysRemaining: number | undefined
    if (isTrial && user.trialEnd) {
      daysRemaining = Math.ceil((user.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    } else if (user.subscriptionEnd) {
      daysRemaining = Math.ceil((user.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const token = await new SignJWT({
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      plan: user.plan || "free",
      isActive: isActive || false,
      daysRemaining: daysRemaining || undefined,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    console.log("✅ Login successful for:", user.email)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      )
    }

    console.error("❌ Login error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    )
  }
}

