import { NextResponse } from "next/server"
import { isAdminSession } from "@/lib/adminSession"
import { signUpload } from "@/lib/cloudinarySignature"

// Las fotos del blog (tapa, imágenes, galerías, portadas de reels): solo el
// admin, en rumbo/blog, con un id al azar que arma lib/uploadImage.ts.
const PUBLIC_ID = /^[0-9a-f]{16}$/

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  const { publicId } = await req.json().catch(() => ({}))
  if (typeof publicId !== "string" || !PUBLIC_ID.test(publicId)) {
    return NextResponse.json({ error: "publicId inválido" }, { status: 400 })
  }
  return NextResponse.json(signUpload("rumbo/blog", publicId))
}
