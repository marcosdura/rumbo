import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

async function refreshIdToken(token) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type:    "refresh_token",
      refresh_token: token.refresh_token,
    }),
  })

  const refreshed = await res.json()
  if (!res.ok) throw refreshed

  return {
    ...token,
    id_token:     refreshed.id_token ?? token.id_token,
    access_token: refreshed.access_token,
    expires_at:   Math.floor(Date.now() / 1000) + refreshed.expires_in,
    refresh_token: refreshed.refresh_token ?? token.refresh_token,
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { access_type: "offline", prompt: "consent" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger, session: updateSession }) {
      // Primer login: upsert usuario y guardar termsAcceptedAt
      if (account) {
        let termsAcceptedAt = null
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/upsert`, {
            method: "POST",
            headers: { Authorization: `Bearer ${account.id_token}` },
          })
          if (res.ok) {
            const user = await res.json()
            termsAcceptedAt = user.terms_accepted_at ?? null
          }
        } catch (e) {
          console.error("Error guardando usuario:", e)
        }
        return {
          ...token,
          id_token:         account.id_token,
          access_token:     account.access_token,
          refresh_token:    account.refresh_token,
          expires_at:       account.expires_at,
          termsAcceptedAt,
        }
      }

      // El usuario acaba de aceptar los términos — actualizar token
      if (trigger === "update" && updateSession?.termsAcceptedAt) {
        return { ...token, termsAcceptedAt: updateSession.termsAcceptedAt }
      }

      // Token todavía válido (con 60s de margen)
      if (Date.now() < (token.expires_at - 60) * 1000) {
        return token
      }

      // Token expirado — renovar
      try {
        return await refreshIdToken(token)
      } catch (e) {
        console.error("Error renovando token:", e)
        return { ...token, error: "RefreshTokenError" }
      }
    },

    async session({ session, token }) {
      session.user.id      = token.sub
      session.id_token     = token.id_token
      session.termsAcceptedAt = token.termsAcceptedAt ?? null
      if (token.error) session.error = token.error
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
