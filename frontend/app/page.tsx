import { Fragment } from "react"
import Footer from "@/components/layout/Footer"
import Navbar from "@/components/layout/Navbar"
import HeroHeader from "@/components/layout/HeroHeader"
import SpotSection from "@/components/spots/SpotSection"
import SearchBar from "@/components/spots/SearchBar"
import AddPlaceInvite from "@/components/spots/AddPlaceInvite"
import ReloadButton from "@/components/ui/ReloadButton"
import { api } from "@/lib/api"
import { heroTagline, type HomeData } from "@/lib/home"

// Se arma en el servidor (antes se pedía todo desde el navegador: Google
// veía la página sin lugares y el usuario un esqueleto de carga). Las
// colecciones rotan por día, así que alcanza con regenerarla cada 10 min.
const REVALIDATE_SECONDS = 600

// La invitación a sumar lugares va después de esta cantidad de secciones.
const INVITE_AFTER = 2

async function loadHome(): Promise<HomeData | null> {
  try {
    const { data } = await api.get<HomeData>("/home", { next: { revalidate: REVALIDATE_SECONDS } })
    return data
  } catch {
    return null
  }
}

export default async function Home() {
  const data = await loadHome()
  const sections = data?.sections ?? []

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4f0" }}>
      {/* Navbar: fixed en home, oculto hasta que el hero salga del viewport */}
      <Navbar />

      {/* Hero — scrollea con la página */}
      <div id="hero-section" style={{ background: "linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 65%, #40916c 100%)", position: "relative", zIndex: 20, padding: "24px 24px 52px", textAlign: "center" }}>
        <HeroHeader />

        <p className="fade-up fade-up-1" style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          color: "#95d5b2",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}>Uruguay al natural</p>

        <h1 className="fade-up fade-up-2" style={{
          fontFamily: "var(--font-playfair-display), serif",
          color: "#fff",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 600,
          lineHeight: 1.15,
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}>Encontrá tu próxima aventura</h1>

        <p className="fade-up fade-up-2" style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          color: "#b7e4c7",
          fontSize: "clamp(15px, 2vw, 18px)",
          fontWeight: 300,
          marginBottom: 40,
        }}>{heroTagline(data?.stats ?? null)}</p>

        <div className="fade-up fade-up-3" style={{ display: "flex", justifyContent: "center" }}>
          <SearchBar hero />
        </div>
      </div>

      <div style={{ flex: 1, fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0px 24px 64px" }}>

          {data === null ? (
            <div style={{ textAlign: "center", padding: "64px 24px" }}>
              <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>No pudimos cargar los lugares.</p>
              <ReloadButton style={{
                fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "var(--primary)", background: "#fff",
                border: "1px solid var(--primary)", borderRadius: 10, padding: "10px 20px", cursor: "pointer",
              }}>
                Reintentar
              </ReloadButton>
            </div>
          ) : (
            <>
              {sections.map((section, i) => (
                <Fragment key={section.key}>
                  <SpotSection
                    label={section.label}
                    title={section.title}
                    count={section.total}
                    spots={section.spots}
                    href={section.href}
                    loading={false}
                  />
                  {i === INVITE_AFTER - 1 && <AddPlaceInvite />}
                </Fragment>
              ))}
              {sections.length < INVITE_AFTER && <AddPlaceInvite />}
            </>
          )}

        </div>
        <Footer />
      </div>
    </div>
  )
}
