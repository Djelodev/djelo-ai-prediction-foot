import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getUserSubscriptionStatus } from "@/lib/subscription"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    // Try different cookie names (NextAuth uses different names based on environment)
    const tokenCookie = 
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value

    if (!tokenCookie) {
      // Return empty session - this is valid for NextAuth
      return NextResponse.json({})
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    
    try {
      const { payload } = await jwtVerify(tokenCookie, secret)
      const userId = (payload.id || payload.sub) as string
      
      if (!userId) {
        return NextResponse.json({})
      }

      // Get subscription status from database
      const subscriptionStatus = await getUserSubscriptionStatus(userId)
      
      // Return session in NextAuth expected format
      return NextResponse.json({
        user: {
          id: userId,
          email: payload.email || null,
          name: payload.name || null,
          image: payload.picture || null,
          createdAt: payload.createdAt || null,
          plan: subscriptionStatus.plan,
          isActive: subscriptionStatus.isActive,
          daysRemaining: subscriptionStatus.daysRemaining,
        },
        expires: payload.exp 
          ? new Date((payload.exp as number) * 1000).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({})
    }
  } catch (error) {
    console.error("Session endpoint error:", error)
    return NextResponse.json({})
  }
}

