import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { activateSubscription } from "@/lib/subscription"
import { z } from "zod"

const activateSchema = z.object({
  plan: z.enum(["pro", "pro_max"]),
  durationMonths: z.number().min(1).max(12).default(1),
  paymentMethod: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    console.log("💳 Subscription activation request received")
    
    // Get user from session
    const cookieStore = await cookies()
    const tokenCookie = 
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value

    if (!tokenCookie) {
      console.error("❌ No token cookie found")
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(tokenCookie, secret)
    const userId = (payload.id || payload.sub) as string

    if (!userId) {
      console.error("❌ No user ID in token")
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 401 }
      )
    }

    console.log("✅ User authenticated:", userId)

    const body = await request.json()
    console.log("📦 Request body:", body)
    
    const { plan, durationMonths } = activateSchema.parse(body)
    console.log("✅ Plan validated:", { plan, durationMonths })

    // In a real app, you would:
    // 1. Process payment with Stripe/PayPal/etc
    // 2. Create subscription record
    // 3. Activate subscription

    // For now, we'll just activate the subscription directly (simulated payment)
    await activateSubscription(userId, plan, durationMonths)
    console.log("✅ Subscription activated successfully")

    return NextResponse.json({
      success: true,
      message: "Abonnement activé avec succès",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("❌ Validation error:", error.errors)
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    console.error("❌ Subscription activation error:", error)
    console.error("❌ Error details:", {
      message: error?.message,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: "Erreur lors de l'activation de l'abonnement",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

