import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "Rumbo — Encontrá tu próxima aventura en Uruguay",
  description: "Descubrí los mejores lugares para camping, trekking, escalada, surf y kayak en Uruguay.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Rumbo — Encontrá tu próxima aventura en Uruguay",
    description: "Descubrí los mejores lugares para camping, trekking, escalada, surf y kayak en Uruguay.",
    type: "website",
    locale: "es_UY",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions)
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
