import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Calculate trial dates (3 days free trial)
    const trialStart = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 3)

    console.log("📝 Creating user with trial:", { 
      name, 
      email, 
      trialStart: trialStart.toISOString(), 
      trialEnd: trialEnd.toISOString() 
    })

    // Create user with free trial
    const user = await db.user.create({
      data: {
        name,
        email,
        plan: "trial",
        trialStart,
        trialEnd,
        isActive: true, // Active during trial
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
            access_token: hashedPassword, // Store hashed password here (temporary solution)
          },
        },
      },
    })

    console.log("✅ User created successfully:", user.id)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("❌ Signup error:", error)
    console.error("❌ Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Log detailed error for debugging
    const errorMessage = error?.message || "Unknown error"
    const errorCode = error?.code || "UNKNOWN"
    
    console.error("❌ Signup error details:", {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
    })
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création du compte",
        details: process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview" 
          ? `${errorMessage} (Code: ${errorCode})` 
          : undefined,
      },
      { status: 500 }
    )
  }
}

