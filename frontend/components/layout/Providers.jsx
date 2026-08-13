"use client"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { useFavoritesStore } from "@/store/favoritesStore"
import { trackEvent } from "@/lib/analytics"

const FATAL_AUTH_ERRORS = ["RefreshTokenError", "NoRefreshToken", "UserNotFound", "SignupError"]

function AuthErrorHandler() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.error && FATAL_AUTH_ERRORS.includes(session.error)) {
      // Log para poder distinguir en consola/monitoreo qué causa disparó el
      // logout: NoRefreshToken/RefreshTokenError = sesión sin refresh_token
      // (login previo a soportarlo, requiere volver a loguearse) vs.
      // UserNotFound/SignupError = problema del lado del usuario/backend.
      console.warn(`Cerrando sesión por error de auth: ${session.error}`)
      signOut({ redirect: false })
    }
  }, [session])
  return null
}

function RememberMeHandler() {
  const { data: session } = useSession()
  useEffect(() => {
    if (!session) return
    if (localStorage.getItem("rumbo_remember_me") !== "false") return

    const handler = () => signOut({ redirect: false })
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [session])
  return null
}

function TermsAcceptHandler() {
  const { data: session, update } = useSession()
  useEffect(() => {
    if (!session?.id_token || session.termsAcceptedAt) return
    if (localStorage.getItem("rumbo_terms_accepted") !== "true") return

    let cancelled = false
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/terms`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.id_token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (!user || cancelled) return
        localStorage.removeItem("rumbo_terms_accepted")
        update({ termsAcceptedAt: user.terms_accepted_at })
      })
      .catch((e) => console.error("Error aceptando términos:", e))

    return () => { cancelled = true }
  }, [session?.id_token, session?.termsAcceptedAt, update])
  return null
}

function LoginTracker() {
  const { data: session, status } = useSession()
  useEffect(() => {
    if (status !== "authenticated" || !session) return
    // Solo confirma el evento si el login se disparó desde un click nuestro
    // (AuthModal / AgregarLugar) — evita contar como "login" cada vez que
    // alguien vuelve a abrir la app ya logueado.
    if (localStorage.getItem("rumbo_pending_login_track") !== "1") return
    localStorage.removeItem("rumbo_pending_login_track")
    trackEvent("login", { method: "google" })
  }, [status, session])
  return null
}

function FavoritesLoader() {
  const { data: session } = useSession()
  const { loadFavorites } = useFavoritesStore()

  useEffect(() => {
    if (session?.id_token) {
      loadFavorites(session.id_token)
    }
  }, [session?.id_token])

  return null
}

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60}>
      <AuthErrorHandler />
      <RememberMeHandler />
      <TermsAcceptHandler />
      <LoginTracker />
      <FavoritesLoader />
      {children}
    </SessionProvider>
  )
}