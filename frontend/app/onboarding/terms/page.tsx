"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

export default function TermsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAccept = async () => {
    if (!accepted || !session?.id_token) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/terms`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.id_token}` },
      })
      if (!res.ok) throw new Error()
      const user = await res.json()
      await update({ termsAcceptedAt: user.terms_accepted_at })
      const callbackUrl = searchParams.get("callbackUrl") || "/"
      router.replace(callbackUrl)
    } catch {
      setError("Hubo un error. Intentá de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1b4332 0%, #2d6a4f 65%, #40916c 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .terms-card {
          background: #f5f4f0;
          border-radius: 24px;
          width: 100%;
          max-width: 640px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.28);
          overflow: hidden;
        }

        .terms-header {
          background: linear-gradient(135deg, #1b4332, #2d6a4f);
          padding: 32px 36px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .terms-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .terms-body {
          padding: 28px 36px 36px;
        }

        .terms-scroll {
          background: #fff;
          border: 1px solid #e0ddd6;
          border-radius: 14px;
          padding: 20px 22px;
          max-height: 320px;
          overflow-y: auto;
          font-size: 13px;
          line-height: 1.75;
          color: #3a3730;
          margin-bottom: 24px;
        }

        .terms-scroll::-webkit-scrollbar { width: 4px; }
        .terms-scroll::-webkit-scrollbar-track { background: transparent; }
        .terms-scroll::-webkit-scrollbar-thumb { background: #c8c4bc; border-radius: 4px; }

        .terms-section-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #2d6a4f;
          margin: 18px 0 6px;
        }
        .terms-section-title:first-child { margin-top: 0; }

        .terms-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 24px;
          padding: 16px;
          background: #fff;
          border: 1.5px solid #e0ddd6;
          border-radius: 14px;
          transition: border-color 0.2s, background 0.2s;
        }
        .terms-checkbox-row:hover { border-color: #2d6a4f; background: #f0f7f3; }
        .terms-checkbox-row.checked { border-color: #2d6a4f; background: #f0f7f3; }

        .terms-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #c8c4bc;
          border-radius: 6px;
          flex-shrink: 0;
          margin-top: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, background 0.2s;
          background: #fff;
        }
        .terms-checkbox.checked { border-color: #2d6a4f; background: #2d6a4f; }

        .terms-btn {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          background: #1b4332;
          color: #fff;
          letter-spacing: 0.02em;
        }
        .terms-btn:disabled {
          background: #c8c4bc;
          color: #9a9690;
          cursor: not-allowed;
        }
        .terms-btn:not(:disabled):hover {
          background: #2d6a4f;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(27, 67, 50, 0.3);
        }
        .terms-btn:not(:disabled):active { transform: translateY(0); }

        @media (max-width: 480px) {
          .terms-header { padding: 24px 20px 20px; }
          .terms-body { padding: 20px 20px 28px; }
          .terms-scroll { max-height: 240px; }
        }
      `}</style>

      <div className="terms-card">
        <div className="terms-header">
          <div className="terms-icon">📋</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#95d5b2", marginBottom: 4 }}>
              Antes de continuar
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.2 }}>
              Términos y Condiciones
            </h1>
          </div>
        </div>

        <div className="terms-body">
          <div className="terms-scroll">
            <div className="terms-section-title">1. Aceptación del servicio</div>
            <p>Al usar Rumbo aceptás estos términos. La plataforma conecta a usuarios con spots para actividades outdoor en Uruguay (camping, trekking, escalada, surf, kayak y glamping). El uso de la plataforma implica la aceptación plena de estas condiciones.</p>

            <div className="terms-section-title">2. Contenido generado por usuarios</div>
            <p>Las reseñas, valoraciones y fotos que subís son responsabilidad tuya. Rumbo se reserva el derecho de eliminar contenido que infrinja derechos de terceros, sea falso, dañino o viole la legislación uruguaya vigente. Al publicar contenido, otorgás a Rumbo una licencia no exclusiva para mostrarlo en la plataforma.</p>

            <div className="terms-section-title">3. Uso de datos de ubicación</div>
            <p>La plataforma puede mostrar mapas y coordenadas de spots públicos. Los datos de ubicación de tu dispositivo solo se usan para mejorar resultados de búsqueda y nunca se comparten con terceros sin tu consentimiento. Podés desactivar el acceso a tu ubicación desde la configuración de tu dispositivo.</p>

            <div className="terms-section-title">4. Actividades de riesgo</div>
            <p>Las actividades de aventura (escalada, kayak, surf, trekking) conllevan riesgos inherentes. Rumbo provee información de referencia y no es responsable por accidentes, lesiones o daños que ocurran durante la práctica de actividades en los spots listados. Siempre verificá las condiciones del lugar antes de ir.</p>

            <div className="terms-section-title">5. Protección de datos personales — Ley 18.331</div>
            <p>En cumplimiento de la Ley N.º 18.331 de Protección de Datos Personales y Acción de Habeas Data de Uruguay, tus datos personales son tratados con confidencialidad. Los datos recabados (nombre, email e imagen de perfil de Google) se usan exclusivamente para identificarte en la plataforma. Tenés derecho a acceder, rectificar y suprimir tus datos en cualquier momento contactando a rumbo.uy.app@gmail.com.</p>

            <div className="terms-section-title">6. Modificaciones</div>
            <p>Rumbo puede actualizar estos términos. Los cambios significativos se notificarán por email. El uso continuado de la plataforma después de los cambios implica la aceptación de los nuevos términos.</p>

            <div className="terms-section-title">7. Ley aplicable</div>
            <p>Estos términos se rigen por la legislación de la República Oriental del Uruguay. Para cualquier disputa, las partes se someten a la jurisdicción de los tribunales competentes de Montevideo.</p>
          </div>

          <label
            className={`terms-checkbox-row${accepted ? " checked" : ""}`}
            onClick={() => setAccepted(v => !v)}
          >
            <div className={`terms-checkbox${accepted ? " checked" : ""}`}>
              {accepted && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 14, color: "#3a3730", lineHeight: 1.5 }}>
              He leído y acepto los <strong>Términos y Condiciones</strong> y la política de privacidad de Rumbo.
            </span>
          </label>

          {error && (
            <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 16, textAlign: "center" }}>{error}</p>
          )}

          <button
            className="terms-btn"
            disabled={!accepted || loading}
            onClick={handleAccept}
          >
            {loading ? "Procesando..." : "Continuar a Rumbo →"}
          </button>

          <p style={{ fontSize: 12, color: "#9a9690", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
            ¿Tenés preguntas? Escribinos a{" "}
            <a href="mailto:rumbo.uy.app@gmail.com" style={{ color: "#2d6a4f" }}>
              rumbo.uy.app@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
