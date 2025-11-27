import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { activateSubscription } from "@/lib/subscription"
import { verifyPaystackTransaction } from "@/lib/paystack"

const querySchema = z.object({
  reference: z.string().min(5),
})

export async function GET(request: NextRequest) {
  try {
    const parsed = querySchema.safeParse({
      reference: request.nextUrl.searchParams.get("reference"),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Référence manquante" }, { status: 400 })
    }

    const { reference } = parsed.data

    const payment = await db.subscriptionPayment.findUnique({
      where: { paystackReference: reference },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Aucun paiement associé à cette référence" },
        { status: 404 }
      )
    }

    if (payment.status === "success") {
      return NextResponse.json({ success: true, alreadyConfirmed: true })
    }

    const verification = await verifyPaystackTransaction(reference)

    const amountMatches = verification.amount === payment.amount
    const paymentStatus = verification.status?.toLowerCase()

    if (paymentStatus === "success" && amountMatches) {
      await db.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: "success",
          paidAt: verification.paid_at ? new Date(verification.paid_at) : new Date(),
          gatewayResponse: verification.gateway_response,
          metadata: verification.metadata ?? payment.metadata,
        },
      })

      const plan = payment.plan === "pro" || payment.plan === "pro_max" ? payment.plan : "pro"

      await activateSubscription(payment.userId, plan, 1)

      return NextResponse.json({ success: true, plan })
    }

    await db.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus || "failed",
        gatewayResponse: verification.gateway_response,
        metadata: verification.metadata ?? payment.metadata,
      },
    })

    const mismatchMessage = !amountMatches
      ? "Le montant retourné ne correspond pas à la commande."
      : `Statut Paystack: ${verification.status}`

    return NextResponse.json(
      {
        success: false,
        error: `Paiement non confirmé. ${mismatchMessage}`,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Paystack verification error:", error)
    return NextResponse.json(
      { error: (error as Error)?.message || "Erreur lors de la vérification du paiement" },
      { status: 500 }
    )
  }
}

