import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { getPaystackPlanConfig, initializePaystackTransaction } from "@/lib/paystack"

const initializeSchema = z.object({
  plan: z.enum(["pro", "pro_max"]),
})

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser()

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = initializeSchema.parse(body)

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, email: true, name: true },
    })

    if (!user || !user.email) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    const { amount, currency, callbackUrl } = getPaystackPlanConfig(plan)
    const reference = `psk_${randomUUID()}`

    const baseMetadata = {
      userId: user.id,
      plan,
      currency,
    }

    const payment = await db.subscriptionPayment.create({
      data: {
        userId: user.id,
        plan,
        amount,
        currency,
        status: "pending",
        paystackReference: reference,
        metadata: baseMetadata,
      },
    })

    const paystackInit = await initializePaystackTransaction({
      email: user.email,
      amount,
      currency,
      callbackUrl,
      reference,
      metadata: {
        ...baseMetadata,
        paymentId: payment.id,
        userEmail: user.email,
      },
    })

    await db.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        paystackAccessCode: paystackInit.access_code,
        gatewayResponse: paystackInit.message,
        metadata: {
          ...baseMetadata,
          paymentId: payment.id,
          userEmail: user.email,
        },
      },
    })

    return NextResponse.json({
      authorizationUrl: paystackInit.authorization_url,
      reference: paystackInit.reference,
    })
  } catch (error) {
    console.error("❌ Paystack initialization error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    return NextResponse.json(
      { error: (error as Error)?.message || "Impossible d'initialiser le paiement" },
      { status: 500 }
    )
  }
}

