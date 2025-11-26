import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"

import { db } from "@/lib/db"

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) {
        await db.passwordResetToken.delete({
          where: { token: resetToken.token },
        })
      }

      return NextResponse.json(
        { error: "Lien invalide ou expiré. Veuillez refaire une demande." },
        { status: 400 }
      )
    }

    const account = await db.account.findFirst({
      where: {
        userId: resetToken.userId,
        type: "credentials",
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: "Aucun compte associé à cet utilisateur." },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)

    await db.account.update({
      where: { id: account.id },
      data: { access_token: hashedPassword },
    })

    await db.passwordResetToken.delete({
      where: { token: resetToken.token },
    })

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été mis à jour avec succès.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      )
    }

    console.error("❌ Reset password error:", error)
    return NextResponse.json(
      { error: "Impossible de mettre à jour le mot de passe pour le moment" },
      { status: 500 }
    )
  }
}

