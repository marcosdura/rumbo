"use client"

import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

        .sf-footer {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          border-radius: 20px 20px 0 0;
          padding: 40px 40px 24px;
          margin-top: 80px;
        }

        .sf-footer-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 40px;
          margin-bottom: 32px;
        }

        .sf-brand-name {
          font-family: var(--font-nunito);
          font-size: 22px;
          font-weight: 600;
          color: var(--fg);
          margin: 8px 0 8px;
        }

        .sf-brand-desc {
          font-size: 13px;
          color: var(--fg-muted);
          line-height: 1.7;
          margin-bottom: 18px;
        }

        .sf-socials { display: flex; gap: 8px; }

        .sf-social-btn {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          text-decoration: none;
        }
        .sf-social-btn svg {
          width: 14px; height: 14px;
          fill: var(--fg-muted);
          transition: fill 0.2s;
        }
        @media (hover: hover) {
          .sf-social-btn:hover {
            background: #1b4332;
            border-color: #1b4332;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(27,67,50,0.2);
          }
          .sf-social-btn:hover svg { fill: #d8f3dc; }
        }

        .sf-col-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2d6a4f;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .sf-col-title::before {
          content: '';
          display: block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .sf-col-links {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 9px;
        }
        .sf-col-links a {
          font-size: 13px;
          color: var(--fg-secondary);
          text-decoration: none;
          transition: color 0.15s;
        }
        @media (hover: hover) {
          .sf-col-links a:hover { color: #1b4332; }
        }

        .sf-divider {
          height: 1px;
          background: var(--border-subtle);
          margin-bottom: 20px;
        }

        .sf-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .sf-copy {
          font-size: 12px;
          color: var(--fg-muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sf-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2d6a4f;
          flex-shrink: 0;
        }

        .sf-badges { display: flex; gap: 8px; flex-wrap: wrap; }

        .sf-badge-warm {
          font-size: 11px; font-weight: 600;
          padding: 3px 10px; border-radius: 999px;
          background: #eae6df;
          border: 1px solid #d0c9bc;
          color: #4a443b;
        }
        .sf-badge-green {
          font-size: 11px; font-weight: 600;
          padding: 3px 10px; border-radius: 999px;
          background: #1b4332;
          color: #d8f3dc;
          border: 1px solid #2d6a4f;
        }

        @media (max-width: 640px) {
          .sf-footer { padding: 24px 20px 20px; margin-top: 48px; }
          .sf-footer-grid { grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
          .sf-brand-desc { max-width: 100%; font-size: 12px; }
          .sf-brand-name { font-size: 18px; }
          .sf-bottom { flex-direction: column; align-items: flex-start; gap: 8px; }
        }
      `}</style>

      <footer className="sf-footer">
        <div className="sf-footer-grid">

          {/* Brand */}
          <div>
            <Image 
              src="/RumboLogo.png" 
              alt="Rumbo logo" 
              width={36} 
              height={36} 
              className="object-contain" 
              style={{ borderRadius: 8 }} 
            />
            <p className="sf-brand-name">rumbo</p>
            <p className="sf-brand-desc">
              Descubrí los mejores lugares de Uruguay. Playas, sierras,
              ciudades y rincones únicos para explorar.
            </p>
            <div className="sf-socials">
              <a className="sf-social-btn" href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a className="sf-social-btn" href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="YouTube">
                <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="sf-col-title">Información</p>
            <ul className="sf-col-links">
              <li><Link href="/legal#rumbo">¿Qué es Rumbo?</Link></li>
              <li><Link href="/legal#privacidad">Política de privacidad</Link></li>
              <li><Link href="/legal#terminos">Términos de uso</Link></li>
              <li><Link href="/legal#contacto">Contacto</Link></li>
            </ul>
          </div>

        </div>

        <div className="sf-divider" />

        <div className="sf-bottom">
          <div className="sf-copy">
            <div className="sf-dot" />
            <span>© 2025 Rumbo Uruguay. Todos los derechos reservados.</span>
          </div>
          <div className="sf-badges">
            <span className="sf-badge-warm">Hecho en Uruguay 🇺🇾</span>
            <span className="sf-badge-green">Código abierto</span>
          </div>
        </div>

      </footer>
    </>
  )
}
