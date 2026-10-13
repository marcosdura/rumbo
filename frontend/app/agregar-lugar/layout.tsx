import type { Metadata } from "next"
import { privateMetadata } from "@/lib/seo"

// Página de la cuenta: título propio y fuera de Google (antes tenía el título
// de la home y nada le decía a Google que no la indexe).
export const metadata: Metadata = privateMetadata("Agregar un lugar")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
