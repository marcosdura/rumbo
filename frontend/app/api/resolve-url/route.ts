import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Único uso real hoy: resolver links cortos de Google Maps (goo.gl/maps.app.goo.gl)
// en LocationPicker.jsx. Sin esta allowlist, el endpoint era un proxy ciego que
// podía apuntar a cualquier URL (metadata de la nube, red interna del hosting, etc.).
function isAllowedHost(hostname: string): boolean {
  return hostname === "goo.gl" || hostname.endsWith(".goo.gl")
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 })
  }

  if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Dominio no permitido" }, { status: 400 })
  }

  try {
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RumboBot/1.0)" },
    })
    return NextResponse.json({ url: res.url })
  } catch {
    return NextResponse.json({ error: "Failed to resolve URL" }, { status: 500 })
  }
}
