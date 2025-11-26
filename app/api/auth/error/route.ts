import { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const error = searchParams.get("error")
  
  // Rediriger vers la page de login avec le message d'erreur
  const loginUrl = new URL("/login", request.url)
  if (error) {
    loginUrl.searchParams.set("error", error)
  }
  
  return NextResponse.redirect(loginUrl)
}

export async function POST(request: NextRequest) {
  return GET(request)
}

