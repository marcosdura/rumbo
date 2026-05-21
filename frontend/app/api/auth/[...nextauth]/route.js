import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        await fetch("http://localhost:8000/users/upsert", {
          method: "POST",
          headers: { Authorization: `Bearer ${account.id_token}` },
        })
      } catch (e) {
        console.error("Error guardando usuario:", e)
      }
      return true
    },
    async jwt({ token, account }) {
      if (account) token.id_token = account.id_token
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub
      session.id_token = token.id_token  // ← línea nueva
      return session
    },
  },
})

export { handler as GET, handler as POST }