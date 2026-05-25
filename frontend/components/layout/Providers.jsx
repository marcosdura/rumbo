"use client"
import { SessionProvider, useSession, signIn } from "next-auth/react"
import { useEffect } from "react"
import { useFavoritesStore } from "@/store/favoritesStore"

function SessionErrorHandler() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signIn("google", {}, { prompt: "select_account" })
    }
  }, [session?.error])
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
    <SessionProvider session={session}>
      <SessionErrorHandler />
      <FavoritesLoader />
      {children}
    </SessionProvider>
  )
}