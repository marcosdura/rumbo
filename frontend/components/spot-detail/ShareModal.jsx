"use client"

import { useState } from "react"

function ShareModal({ name, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Mirá esto: ${name}\n`)
    window.open(`https://wa.me/?text=${text}${url}`, "_blank")
  }

  return (
    <>
      <style>{`
        .share-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.32);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          animation: smFadeIn 0.18s ease;
        }
        @keyframes smFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .share-modal {
          background: #fff;
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          position: relative;
          animation: smSlideUp 0.22s cubic-bezier(0.22,1,0.36,1);
          font-family: var(--font-dm-sans), sans-serif;
        }
        @keyframes smSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .share-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid var(--border); background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; color: var(--muted);
          transition: all 0.15s;
        }
        .share-modal-close:hover { background: #f7f5f0; color: #1b1b19; }

        .share-modal-btn {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 14px 16px;
          border-radius: 14px; border: 1px solid var(--border);
          background: #fff; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 14px; font-weight: 500; color: #1b1b19;
          transition: all 0.15s;
          text-align: left;
        }
        .share-modal-btn:hover { background: #f7f5f0; transform: translateY(-1px); }
        .share-modal-btn.copied { background: #e8f5ee; border-color: #b7dfc8; color: var(--primary-dark); }
      `}</style>

      <div className="share-modal-overlay" onClick={onClose}>
        <div className="share-modal" onClick={e => e.stopPropagation()}>

          <button className="share-modal-close" onClick={onClose}>✕</button>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} />
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)", margin: 0 }}>
              Compartir
            </p>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair-display), serif", fontSize: 20, fontWeight: 600, color: "#1b1b19", margin: "0 0 20px" }}>
            {name}
          </h2>

          {/* URL preview */}
          <div style={{
            background: "#f7f5f0", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "var(--muted)", marginBottom: 16,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {typeof window !== "undefined" ? window.location.href : ""}
          </div>

          {/* Botones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className={`share-modal-btn${copied ? " copied" : ""}`} onClick={handleCopy}>
              <span style={{ fontSize: 20 }}>{copied ? "✅" : "🔗"}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{copied ? "¡Copiado!" : "Copiar link"}</p>
                <p style={{ margin: 0, fontSize: 11, color: copied ? "var(--primary)" : "var(--muted)", fontWeight: 400 }}>
                  {copied ? "El link está en tu portapapeles" : "Pegalo donde quieras"}
                </p>
              </div>
            </button>

            <button className="share-modal-btn" onClick={handleWhatsApp}>
              <span style={{ fontSize: 20 }}>💬</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>WhatsApp</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>Compartir por mensaje</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </>
  )
}

export default ShareModal