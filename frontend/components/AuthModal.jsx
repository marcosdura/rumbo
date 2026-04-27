"use client"

import { createPortal } from "react-dom"
import { signIn } from "next-auth/react"

export default function AuthModal({ onClose }) {
  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: overlayIn 0.2s ease forwards;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .auth-modal {
          font-family: 'DM Sans', sans-serif;
          background: white;
          border-radius: 24px;
          padding: 40px 36px 32px;
          width: 100%;
          max-width: 400px;
          margin: 16px;
          position: relative;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
          animation: modalIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .auth-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.06);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #555;
          transition: background 0.15s;
        }
        .auth-close:hover { background: rgba(0,0,0,0.1); }

        .auth-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }

        .auth-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          text-align: center;
          margin-bottom: 10px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .auth-divider {
          height: 1px;
          background: rgba(0,0,0,0.07);
          margin-bottom: 24px;
        }

        .auth-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.12);
          background: white;
          font-size: 15px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .auth-google-btn:hover {
          background: #f9fafb;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }

        .auth-note {
          font-size: 12px;
          color: #9ca3a0;
          text-align: center;
          margin-top: 16px;
        }
      `}</style>

      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>

          <button className="auth-close" onClick={onClose}>✕</button>

          <div className="auth-icon">🔒</div>

          <h2 className="auth-title">Iniciá sesión</h2>
          <p className="auth-subtitle">
            Necesitás iniciar sesión para completar esta acción.
          </p>

          <div className="auth-divider" />

          <button
            className="auth-google-btn"
            onClick={() => signIn("google", {}, { prompt: "select_account" })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p className="auth-note">
            Tu información está segura y no compartimos tus datos.
          </p>

        </div>
      </div>
    </>,
    document.body
  )
}