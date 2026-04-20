"use client"

import { useSession, signOut } from "next-auth/react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="h-screen flex flex-col bg-[#f5f4f0]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#b4aa96",
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); opacity: 0.4; }
              50% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!session) return null

  const { user } = session
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  const joinDate = new Date().toLocaleDateString("es-UY", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .profile-page { font-family: 'DM Sans', sans-serif; }
        .profile-title { font-family: 'Playfair Display', serif; }

        .fade-up {
          opacity: 0;
          transform: translateY(18px);
          animation: fadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }
        .fade-up-4 { animation-delay: 0.35s; }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .section-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9ca3a0;
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, rgba(0,0,0,0.06), transparent);
          margin: 0.75rem 0 1.5rem;
        }

        .profile-card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          overflow: hidden;
        }

        .avatar-ring {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 3px solid rgba(110,231,183,0.4);
          padding: 3px;
          flex-shrink: 0;
        }
        .avatar-ring img,
        .avatar-ring .avatar-initials {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6ee7b7, #3b82f6);
          font-size: 28px;
          font-weight: 500;
          color: white;
          font-family: 'DM Sans', sans-serif;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .info-row:last-child { border-bottom: none; }

        .info-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        .info-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9ca3a0;
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 400;
        }

        .stat-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 18px 20px;
          text-align: center;
          flex: 1;
        }
        .stat-number {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 11px;
          color: #9ca3a0;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 400;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.7);
          color: #374151;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          width: 100%;
          text-align: left;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.95);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        }
        .action-btn.danger {
          color: #dc2626;
          border-color: rgba(220,38,38,0.15);
          background: rgba(220,38,38,0.03);
        }
        .action-btn.danger:hover {
          background: rgba(220,38,38,0.07);
          box-shadow: 0 4px 12px rgba(220,38,38,0.08);
        }
        .action-btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .action-btn.danger .action-btn-icon {
          background: rgba(220,38,38,0.08);
        }

        .coming-soon-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #e8e3d8, #c6bdaa);
          color: #4a443b;
          border: 1px solid #b4aa96;
          margin-left: auto;
        }
      `}</style>

      <Navbar />

      <div className="flex flex-1 profile-page">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">

            {/* Header */}
            <div className="mb-2 fade-up fade-up-1">
              <p className="section-label">Tu cuenta</p>
              <h2 className="profile-title text-4xl font-semibold text-gray-900 mt-1">
                Perfil
              </h2>
            </div>

            <div className="divider fade-up fade-up-1" />

            {/* Card principal */}
            <div className="profile-card p-6 mb-4 fade-up fade-up-2">

              {/* Avatar + nombre */}
              <div className="flex items-center gap-5 mb-6">
                <div className="avatar-ring">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="avatar-initials">{initials}</div>
                  )}
                </div>
                <div>
                  <p className="profile-title text-2xl font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Miembro desde {joinDate}
                  </p>
                </div>
              </div>

              {/* Info rows */}
              <div>
                <div className="info-row">
                  <div className="info-icon">✉️</div>
                  <div>
                    <p className="info-label">Email</p>
                    <p className="info-value">{user.email}</p>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon">🔗</div>
                  <div>
                    <p className="info-label">Cuenta conectada</p>
                    <p className="info-value">Google</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 mb-4 fade-up fade-up-3">
              <div className="stat-card">
                <p className="stat-number">0</p>
                <p className="stat-label">Spots visitados</p>
              </div>
              <div className="stat-card">
                <p className="stat-number">0</p>
                <p className="stat-label">Reviews</p>
              </div>
              <div className="stat-card">
                <p className="stat-number">0</p>
                <p className="stat-label">Favoritos</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="profile-card p-4 fade-up fade-up-4">
              <div className="flex flex-col gap-2">

                <button className="action-btn" disabled>
                  <div className="action-btn-icon">🗺️</div>
                  Mis spots visitados
                  <span className="coming-soon-badge">Próximamente</span>
                </button>

                <button className="action-btn" disabled>
                  <div className="action-btn-icon">⭐</div>
                  Mis favoritos
                  <span className="coming-soon-badge">Próximamente</span>
                </button>

                <button className="action-btn" disabled>
                  <div className="action-btn-icon">📝</div>
                  Mis reviews
                  <span className="coming-soon-badge">Próximamente</span>
                </button>

                <div style={{ height: 1, background: "rgba(0,0,0,0.05)", margin: "4px 0" }} />

                <button
                  className="action-btn danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <div className="action-btn-icon">↩</div>
                  Cerrar sesión
                </button>

              </div>
            </div>

          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}