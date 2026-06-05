"use client"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"
import { useFavoritesStore } from "@/store/favoritesStore"

function AuthErrorHandler() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signOut({ redirect: false })
    }
  }, [session])
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider session={session}>
        <AuthErrorHandler />
        <FavoritesLoader />
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}