import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que siempre pasan sin verificación
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })

  // Usuario logueado sin términos aceptados → redirigir
  if (token && !token.termsAcceptedAt) {
    return NextResponse.redirect(
  new URL(`/onboarding/terms?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
)
  }

  // Admin: solo el email autorizado
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!token) return NextResponse.redirect(new URL("/", request.url))
    if (token.email !== adminEmail) return NextResponse.redirect(new URL("/", request.url))
  }

  // Rutas protegidas sin sesión → redirigir a home
  if (!token && pathname.startsWith("/profile")) {    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
