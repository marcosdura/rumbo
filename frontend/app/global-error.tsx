"use client"

// Último recurso: falló el layout mismo (sesión, fuentes, Providers), así que
// reemplaza la página entera. Sin navbar ni variables de globals.css: lo que
// falló puede ser justo eso. Colores fijos (los de --primary).
export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const button = {
    borderRadius: 12, padding: "11px 22px", fontSize: 14, fontWeight: 600, textDecoration: "none",
    fontFamily: "inherit", cursor: "pointer", border: "1px solid #2d6a4f", display: "inline-block",
  } as const
  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0", fontFamily: "system-ui, sans-serif", padding: 16, boxSizing: "border-box" }}>
        <title>Algo salió mal | Rumbo</title>
        <main style={{ maxWidth: 520, textAlign: "center" }}>
          <p style={{ fontSize: 40, margin: "0 0 8px" }} aria-hidden="true">⛺</p>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1b1b19", margin: "0 0 10px" }}>Algo salió mal</h1>
          <p style={{ fontSize: 15, color: "#5f5b53", lineHeight: 1.5, margin: "0 0 28px" }}>
            Rumbo no pudo cargar. Puede ser algo pasajero: probá de nuevo en unos segundos.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => unstable_retry()} style={{ ...button, background: "#2d6a4f", color: "#fff" }}>Reintentar</button>
            {/* <a> y no Link: una carga completa sale del estado roto (el router puede ser lo que falló). */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ ...button, background: "#fff", color: "#2d6a4f" }}>Ir al inicio</a>
          </div>
        </main>
      </body>
    </html>
  )
}
