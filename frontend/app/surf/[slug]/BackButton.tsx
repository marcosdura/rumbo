"use client"

import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 500,
        color: "#9a9690",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        marginBottom: 24,
        fontFamily: "inherit",
        transition: "color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.color = "#1b1b19")}
      onMouseLeave={e => (e.currentTarget.style.color = "#9a9690")}
    >
      ← Volver
    </button>
  )
}
