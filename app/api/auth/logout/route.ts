import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Delete all possible session cookies
    cookieStore.delete("next-auth.session-token")
    cookieStore.delete("__Secure-next-auth.session-token")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

