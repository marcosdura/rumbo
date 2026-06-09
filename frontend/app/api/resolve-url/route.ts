import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 })

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RumboBot/1.0)" },
    })
    return NextResponse.json({ url: res.url })
  } catch {
    return NextResponse.json({ error: "Failed to resolve URL" }, { status: 500 })
  }
}
