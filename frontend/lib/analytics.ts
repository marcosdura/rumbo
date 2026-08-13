import { sendGAEvent } from "@next/third-parties/google"

// No-op si todavía no se configuró NEXT_PUBLIC_GA_MEASUREMENT_ID (dev local,
// o antes de que el env var esté seteado en producción) — evita warnings en
// consola y hace que instrumentar un evento nuevo sea siempre seguro.
const GA_ENABLED = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export type AnalyticsParams = Record<string, string | number | boolean | undefined>

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!GA_ENABLED || typeof window === "undefined") return
  try {
    sendGAEvent("event", name, params)
  } catch {
    // El tracking nunca debe romper la app.
  }
}
