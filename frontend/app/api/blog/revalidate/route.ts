import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { isAdminSession } from "@/lib/adminSession"

// Después de guardar en el editor: el inicio del blog, las notas tocadas
// (con su link viejo, si cambió) y su imagen para historias, /links y el
// sitemap se vuelven a armar en la próxima visita, sin esperar los 10
// minutos de revalidate.
const SLUG = /^[a-z0-9-]{1,160}$/

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  const { slugs } = await req.json().catch(() => ({}))
  const valid = Array.isArray(slugs) ? slugs.filter((s): s is string => typeof s === "string" && SLUG.test(s)).slice(0, 5) : []
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")
  revalidatePath("/links")
  valid.forEach(slug => {
    revalidatePath(`/blog/${slug}`)
    revalidatePath(`/blog/${slug}/historia`)
  })
  return NextResponse.json({ revalidated: valid })
}
