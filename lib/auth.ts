// Helper functions for server-side authentication
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export async function getSession() {
  try {
    const cookieStore = await cookies()
    
    // Try different cookie names
    const tokenCookie = 
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value

    if (!tokenCookie) {
      return null
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    
    try {
      const { payload } = await jwtVerify(tokenCookie, secret)
      
      return {
        user: {
          id: (payload.id as string) || (payload.sub as string) || "",
          email: (payload.email as string) || "",
          name: (payload.name as string) || "",
          image: (payload.picture as string) || "",
          createdAt: (payload.createdAt as string) || null,
          plan: (payload.plan as string) || "free",
          isActive: (payload.isActive as boolean) || false,
          daysRemaining: (payload.daysRemaining as number) || undefined,
        },
        expires: payload.exp 
          ? new Date((payload.exp as number) * 1000).toISOString() 
          : null,
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return null
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession()
    return session?.user || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
