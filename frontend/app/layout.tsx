import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito, Playfair_Display, DM_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google"
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

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rumbo | Encontrá tu próxima aventura en Uruguay",
  description: "Descubrí los mejores lugares para camping, trekking, escalada, surf y kayak en Uruguay.",
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/favicon-180.png',
    other: [
      { rel: 'icon', url: '/favicon-192.png', sizes: '192x192' },
    ],
  },
  openGraph: {
    title: "Rumbo — Encontrá tu próxima aventura en Uruguay",
    description: "Descubrí los mejores lugares para camping, trekking, escalada, surf y kayak en Uruguay.",
    type: "website",
    locale: "es_UY",
  },
  // Para que iOS abra en modo standalone al agregar a pantalla de inicio.
  appleWebApp: {
    capable: true,
    title: "Rumbo",
    statusBarStyle: "black-translucent",
  },
};

// themeColor va en su propio export, no dentro de metadata (ver
// docs/01-app/03-api-reference/04-functions/generate-viewport.md).
// Es el --primary-dark de globals.css, el verde de la barra superior.
export const viewport: Viewport = {
  themeColor: "#1b4332",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions)
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${playfairDisplay.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers session={session}>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}
