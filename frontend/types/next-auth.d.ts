import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    id_token?: string
    error?: string
    termsAcceptedAt?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    termsAcceptedAt?: string | null
    lastChecked?: number
    error?: string
  }
}
