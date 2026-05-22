"use client"
import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"
import { useFavoritesStore } from "@/store/favoritesStore"

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
      <FavoritesLoader />
      {children}
    </SessionProvider>
  )
}