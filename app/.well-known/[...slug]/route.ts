import { NextResponse } from "next/server"

interface RouteParams {
  params: {
    slug?: string[]
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const slugPath = params.slug?.join("/") ?? ""
  const filename = process.env.PAYSTACK_VERIFICATION_FILENAME
  const content = process.env.PAYSTACK_VERIFICATION_CONTENT

  if (!filename || !content) {
    return new NextResponse("Verification file not configured", { status: 404 })
  }

  if (slugPath !== filename) {
    return new NextResponse("Not found", { status: 404 })
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  })
}

