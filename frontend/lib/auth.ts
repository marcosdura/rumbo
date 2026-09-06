"use client"

import { signIn } from "next-auth/react"

// Único punto de entrada al login con Google.
//
// Antes esto vivía duplicado en AuthModal y en la pantalla de "necesitás una
// cuenta" de AgregarLugar, y las dos copias se habían separado: las dos le
// decían al usuario "al continuar aceptás nuestros términos", pero solo
// AuthModal marcaba rumbo_terms_accepted. Resultado: quien entraba por
// AgregarLugar veía la leyenda y su terms_accepted_at quedaba en null para
// siempre. Con un solo lugar que sepa marcar la aceptación, eso no puede
// volver a divergir.
//
// El flag lo levanta TermsAcceptHandler (components/layout/Providers.jsx), que
// lo persiste con PATCH /users/me/terms y después lo borra.

type Options = {
  callbackUrl?: string
  // Solo AuthModal ofrece la opción; el resto de las pantallas mantiene la
  // sesión, que es el default.
  rememberMe?: boolean
}

export function signInWithGoogle({ callbackUrl, rememberMe }: Options = {}) {
  if (rememberMe !== undefined) {
    localStorage.setItem("rumbo_remember_me", rememberMe ? "true" : "false")
  }

  // Aceptación implícita de los términos: es el único mecanismo del sitio.
  localStorage.setItem("rumbo_terms_accepted", "true")

  // Se confirma como evento "login" recién cuando la sesión aparece
  // (LoginTracker en Providers.jsx) — así no contamos clicks cancelados.
  localStorage.setItem("rumbo_pending_login_track", "1")

  // "select_account" solo deja elegir cuenta; el access_type: "offline" y el
  // prompt: "consent" que hacen que Google reemita refresh_token ya vienen del
  // provider (app/api/auth/[...nextauth]/route.js).
  signIn("google", callbackUrl ? { callbackUrl } : {}, { prompt: "select_account consent" })
}
