"use client"

import Link from "next/link"
import StatusPage, { primaryButton, secondaryButton } from "@/components/layout/StatusPage"
import { signInWithGoogle } from "@/lib/auth"

// Páginas de tu cuenta sin sesión iniciada (perfil, favoritos, reseñas,
// notificaciones, panel del dueño). Antes mandaban a la home sin explicar
// nada: un link de una notificación abierto sin sesión se perdía. Ahora pide
// iniciar sesión y vuelve a esta misma página.
export default function LoginRequired({ page }: { page?: string }) {
  return (
    <StatusPage
      emoji="🔒"
      title="Iniciá sesión para ver esta página"
      text={page ? `«${page}» es parte de tu cuenta. Iniciá sesión y te traemos de vuelta acá.` : "Es parte de tu cuenta. Iniciá sesión y te traemos de vuelta acá."}
    >
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" style={primaryButton} onClick={() => signInWithGoogle({ callbackUrl: window.location.href })}>
          Continuar con Google
        </button>
        <Link href="/" style={secondaryButton}>Ir al inicio</Link>
      </div>
      {/* Como en el modal de login: signInWithGoogle marca la aceptación. */}
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "20px 0 0" }}>
        Al continuar aceptás nuestros{" "}
        <Link href="/legal#terminos" style={{ color: "var(--primary)", fontWeight: 600 }}>Términos y condiciones</Link>
      </p>
    </StatusPage>
  )
}
