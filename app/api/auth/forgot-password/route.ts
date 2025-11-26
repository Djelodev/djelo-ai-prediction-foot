import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { z } from "zod"

import { db } from "@/lib/db"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    const normalizedEmail = email.toLowerCase()

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
      })
    }

    await db.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    })

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`

    if (process.env.NODE_ENV !== "production") {
      console.log("🔐 Password reset requested:", {
        email: normalizedEmail,
        resetUrl,
        expiresAt,
      })
    }

    return NextResponse.json({
      success: true,
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifiez vos emails.",
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      )
    }

    console.error("❌ Forgot password error:", error)
    return NextResponse.json(
      { error: "Impossible de traiter la demande pour le moment" },
      { status: 500 }
    )
  }
}

