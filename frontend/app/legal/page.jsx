"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

const SECTIONS = [
  {
    id: "rumbo",
    emoji: "🧭",
    title: "¿Qué es Rumbo?",
    content: (
      <div className="legal-content">
        <p className="legal-intro">La plataforma para descubrir lo mejor del Uruguay al aire libre.</p>

        <h4 className="legal-subtitle">La plataforma</h4>
        <p className="legal-p">
          Rumbo es una aplicación web que te ayuda a descubrir lugares outdoor en Uruguay. Desde dunas y senderos hasta cascadas y miradores — Rumbo reúne los spots que valen la pena, con información real de quienes ya estuvieron ahí.
        </p>

        <h4 className="legal-subtitle">Para quién es</h4>
        <p className="legal-p">
          Para cualquier persona que quiera salir a explorar Uruguay. Ya sea que busques una aventura, un plan de fin de semana en familia o simplemente una excusa para desconectarte, Rumbo te da el punto de partida.
        </p>

        <h4 className="legal-subtitle">Qué podés hacer</h4>
        <ul className="legal-list">
          <li>Descubrir spots outdoor verificados en todo el país</li>
          <li>Ver información práctica de cada lugar</li>
          <li>Dejar tu calificación y experiencia personal</li>
          <li>Guardar tus lugares favoritos para volver a visitarlos</li>
        </ul>
      </div>
    ),
  },
  {
    id: "privacidad",
    emoji: "🔒",
    title: "Política de privacidad",
    content: (
      <div className="legal-content">
        <p className="legal-intro">Cómo tratamos tu información. Regida por la Ley 18.331 de Uruguay.</p>

        <h4 className="legal-subtitle">Datos que recolectamos</h4>
        <p className="legal-p">Al registrarte y usar Rumbo, recolectamos los siguientes datos:</p>
        <ul className="legal-list">
          <li><strong>Datos de cuenta:</strong> nombre y dirección de email (vía Google)</li>
          <li><strong>Datos de navegación:</strong> páginas visitadas dentro de la plataforma y tiempo de uso</li>
          <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y navegador</li>
        </ul>

        <h4 className="legal-subtitle">Para qué usamos tus datos</h4>
        <ul className="legal-list">
          <li>Autenticarte y mantener tu sesión activa entre visitas</li>
          <li>Recordar tus preferencias y actividad dentro de la plataforma</li>
          <li>Enviarte novedades y actualizaciones sobre Rumbo (podés darte de baja cuando quieras)</li>
          <li>Mejorar la experiencia de la plataforma basándonos en patrones de uso agregados</li>
        </ul>

        <h4 className="legal-subtitle">Lo que NO hacemos</h4>
        <ul className="legal-list">
          <li>No vendemos tus datos a terceros</li>
          <li>No compartimos tu información con otras empresas</li>
          <li>No usamos servicios de publicidad ni rastreo externo (sin Google Analytics, sin Meta Pixel)</li>
        </ul>

        <h4 className="legal-subtitle">Retención de datos</h4>
        <p className="legal-p">
          Tus datos se mantienen activos mientras uses la plataforma. Si no ingresás a tu cuenta durante 3 meses consecutivos, eliminamos tu información de nuestros sistemas de forma automática.
        </p>

        <h4 className="legal-subtitle">Seguridad</h4>
        <p className="legal-p">
          Tu sesión está protegida mediante tokens de autenticación seguros. Tomamos medidas razonables para proteger tu información contra accesos no autorizados.
        </p>

        <h4 className="legal-subtitle">Tus derechos</h4>
        <p className="legal-p">
          De acuerdo con la Ley 18.331 de Protección de Datos Personales de Uruguay, tenés derecho a:
        </p>
        <ul className="legal-list">
          <li>Acceder a los datos personales que tenemos sobre vos</li>
          <li>Solicitar la corrección de datos incorrectos</li>
          <li>Pedir la eliminación de tu cuenta y datos</li>
          <li>Darte de baja de comunicaciones en cualquier momento</li>
        </ul>
        <p className="legal-p">
          Para ejercer cualquiera de estos derechos, contactanos directamente desde la plataforma.
        </p>
      </div>
    ),
  },
  {
    id: "terminos",
    emoji: "📋",
    title: "Términos de uso",
    content: (
      <div className="legal-content">
        <p className="legal-intro">Al usar Rumbo, aceptás estas condiciones. Última actualización: mayo 2025.</p>

        <h4 className="legal-subtitle">Uso del servicio</h4>
        <p className="legal-p">
          Rumbo es una plataforma de descubrimiento de lugares outdoor en Uruguay. Podés explorar spots, ver información de cada lugar y dejar tu propia calificación u opinión. El uso del servicio es personal y no comercial.
        </p>

        <h4 className="legal-subtitle">Conducta esperada</h4>
        <p className="legal-p">Rumbo es una comunidad basada en el respeto. Al dejar opiniones, calificaciones o cualquier tipo de contenido, te comprometés a:</p>
        <ul className="legal-list">
          <li>Usar lenguaje cordial y respetuoso en todo momento</li>
          <li>No publicar contenido ofensivo, insultante, discriminatorio o abusivo</li>
          <li>Compartir experiencias honestas y de buena fe</li>
        </ul>
        <p className="legal-p">
          Nos reservamos el derecho de eliminar cualquier contenido que viole estas normas, sin previo aviso.
        </p>

        <h4 className="legal-subtitle">Exención de responsabilidad</h4>
        <p className="legal-p">
          La información disponible en Rumbo es de carácter orientativo. Cada usuario es responsable de su propia seguridad y decisiones al visitar cualquier lugar listado en la plataforma.
        </p>
        <p className="legal-p">
          Rumbo no se hace responsable por accidentes, lesiones, daños materiales, condiciones climáticas adversas, cambios en el acceso a los lugares, ni ninguna consecuencia derivada del uso de la información publicada en la plataforma. Visitás cada lugar bajo tu propio riesgo.
        </p>

        <h4 className="legal-subtitle">Propiedad intelectual</h4>
        <p className="legal-p">
          El diseño, contenido editorial, marca y código de Rumbo son propiedad exclusiva de sus creadores. No está permitido reproducir, copiar o redistribuir ningún contenido de la plataforma sin autorización expresa.
        </p>

        <h4 className="legal-subtitle">Modificaciones</h4>
        <p className="legal-p">
          Podemos actualizar estos términos en cualquier momento. Te notificaremos de cambios significativos a través de la plataforma o por email. El uso continuado del servicio implica la aceptación de los términos vigentes.
        </p>

        <h4 className="legal-subtitle">Ley aplicable</h4>
        <p className="legal-p">
          Estos términos se rigen por la legislación vigente en la República Oriental del Uruguay. Cualquier disputa será resuelta ante los tribunales competentes del Uruguay.
        </p>
      </div>
    ),
  },
  {
    id: "contacto",
    emoji: "✉️",
    title: "Contacto",
    content: null,
  },
]

function Accordion({ section, isOpen, onToggle }) {
  return (
    <div className="legal-item" id={section.id}>
      <button
        className={`legal-header ${isOpen ? "is-open" : ""}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="legal-header-left">
          <span className="legal-emoji">{section.emoji}</span>
          <span className="legal-header-title">{section.title}</span>
        </span>
        <span className={`legal-chevron ${isOpen ? "is-open" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="legal-body">
          {section.content ?? (
            <p className="legal-placeholder">Contenido próximamente.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function LegalPage() {
  const [openIds, setOpenIds] = useState(new Set())

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`

        .legal-wrapper {
          max-width: 720px;
          margin: 0 auto;
          padding: 40px 24px 64px;
          min-height: calc(100vh - 200px);
        }

        .legal-page-title {
          font-family: var(--font-playfair-display), serif;
          font-size: 36px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0;
          line-height: 1.2;
        }

        /* Acordeón */
        .legal-item {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          scroll-margin-top: 100px;
        }

        .legal-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          text-align: left;
          transition: background 0.15s;
          gap: 12px;
        }
        @media (hover: hover) {
          .legal-header:hover { background: #f7f5f0; }
        }
        .legal-header.is-open { background: #f7f5f0; }

        .legal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .legal-emoji {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
        }

        .legal-header-title {
          font-size: 16px;
          font-weight: 600;
          color: #1b1b19;
        }

        .legal-chevron {
          color: var(--muted);
          flex-shrink: 0;
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .legal-chevron.is-open {
          transform: rotate(180deg);
          color: var(--primary);
        }

        .legal-body {
          padding: 0 24px 24px;
          border-top: 1px solid #ede9e1;
        }

        .legal-placeholder {
          font-size: 14px;
          color: var(--muted);
          font-style: italic;
          margin: 20px 0 0;
          line-height: 1.6;
        }

        /* Contenido */
        .legal-content { padding-top: 20px; }

        .legal-intro {
          font-size: 14px;
          color: #7a7669;
          font-style: italic;
          margin: 0 0 20px;
          line-height: 1.6;
          padding-bottom: 16px;
          border-bottom: 1px solid #ede9e1;
        }

        .legal-subtitle {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--primary);
          margin: 20px 0 8px;
        }
        .legal-subtitle:first-of-type { margin-top: 0; }

        .legal-p {
          font-size: 14px;
          color: #4a443b;
          line-height: 1.7;
          margin: 0 0 10px;
        }
        .legal-p:last-child { margin-bottom: 0; }

        .legal-list {
          font-size: 14px;
          color: #4a443b;
          line-height: 1.7;
          margin: 0 0 10px;
          padding-left: 18px;
        }
        .legal-list li { margin-bottom: 4px; }
        .legal-list li:last-child { margin-bottom: 0; }
        .legal-list strong { color: #1b1b19; font-weight: 600; }

        @media (max-width: 640px) {
          .legal-wrapper { padding: 24px 16px 48px; }
          .legal-page-title { font-size: 28px; }
          .legal-header { padding: 16px 18px; }
          .legal-header-title { font-size: 15px; }
          .legal-body { padding: 0 18px 20px; }
          .legal-p, .legal-list { font-size: 13px; }
        }
      `}</style>

      <Navbar />

      <div style={{ flex: 1 }}>
        <div className="legal-wrapper">

          {/* Header */}
          <div className="fade-up fade-up-1" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
                Información
              </p>
            </div>
            <h1 className="legal-page-title">Legal e Info</h1>
          </div>

          {/* Divider */}
          <div className="fade-up fade-up-1" style={{ height: 1, background: "var(--border)", marginBottom: 28 }} />

          {/* Acordeones */}
          <div className="fade-up fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 10, overflowAnchor: "none" }}>
            {SECTIONS.map(section => (
              <Accordion
                key={section.id}
                section={section}
                isOpen={openIds.has(section.id)}
                onToggle={() => toggle(section.id)}
              />
            ))}
          </div>

        </div>

        <Footer />
      </div>
    </div>
  )
}
