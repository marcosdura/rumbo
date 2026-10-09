"use client"

// "← Volver": si se llegó desde otra página de Rumbo, vuelve a esa; si se
// entró por un link de afuera, router.back() sacaba de Rumbo: va a la playa.
import { useRouter } from "next/navigation"
import { cameFromRumbo } from "@/lib/spotDetail"

export default function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => cameFromRumbo(document.referrer, window.location.origin) ? router.back() : router.push(fallback)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 500,
        color: "var(--muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        marginBottom: 24,
        fontFamily: "inherit",
        transition: "color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.color = "#1b1b19")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
    >
      ← Volver
    </button>
  )
}
