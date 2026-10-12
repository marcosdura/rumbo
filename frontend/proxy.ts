import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Antes era middleware.tsx (Next 16 lo renombró a proxy) y corría en todas
// las requests, decodificando la sesión hasta para las imágenes. Ahora solo
// en las rutas que protege.

// A dónde mandar a quien no puede entrar (null = pasa).
export function redirectFor(pathname: string, email: string | null | undefined, adminEmail: string | undefined): string | null {
  if (pathname.startsWith("/admin") && (!email || email !== adminEmail)) return "/"
  if (pathname.startsWith("/profile") && !email) return "/"
  return null
}

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request })
  const to = redirectFor(request.nextUrl.pathname, token?.email, process.env.ADMIN_EMAIL)
  return to ? NextResponse.redirect(new URL(to, request.url)) : NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
}
