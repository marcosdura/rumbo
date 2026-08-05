"use client"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { useFavoritesStore } from "@/store/favoritesStore"

function AuthErrorHandler() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.error === "RefreshTokenError" || session?.error === "UserNotFound" || session?.error === "SignupError") {
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
      <FavoritesLoader />
      {children}
    </SessionProvider>
  )
}