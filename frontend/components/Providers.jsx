"use client"
import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"
import { useFavoritesStore } from "@/store/favoritesStore"

function FavoritesLoader() {
  const { data: session } = useSession()
  const { loadFavorites } = useFavoritesStore()

  useEffect(() => {
    if (session?.user?.id) {
      loadFavorites(session.user.id)
    }
  }, [session?.user?.id])

  return null
}

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <FavoritesLoader />
      {children}
    </SessionProvider>
  )
}