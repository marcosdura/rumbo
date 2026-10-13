"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import FavoriteButton from "@/components/spot-detail/FavoriteButton"
import Pill from "@/components/ui/Pill"
import { CldImage } from 'next-cloudinary'
import { PETS_EMOJI, factsLine, ratingLabel } from "@/lib/spotCard"
import "./SpotCard.css"

const CATEGORY_EMOJI = {
  Camping: "🏕️", Glamping: "🛖", Trekking: "🥾",
  Escalada: "🧗", Surf: "🏄", Kayak: "🛶", Motorhome: "🚐",
}

// Cuántas cards de arriba cargan la foto de entrada (las que se ven sin
// scrollear en PC; en el celular, las primeras dos). Con "lazy" el navegador
// esperaba ~3,7 s para pedir la foto más grande de la pantalla.
export const EAGER_CARDS = 4

function SpotCard({ spot, isHighlighted = false, activeCategory, priority = false }) {
  const [showExtraCategories, setShowExtraCategories] = useState(false)
  const [extraCategoriesPos, setExtraCategoriesPos] = useState(null)
  const mainImage = spot.images?.find(img => img.is_main) ?? spot.images?.[0]

  // Con mouse, las categorías extra se ven al pasar por encima; en pantallas
  // táctiles, con un toque. Se pregunta en el momento (antes cada card
  // escuchaba el resize de la ventana).
  const canHover = () => typeof window !== "undefined" && !!window.matchMedia?.("(hover: hover)").matches
  const rating = ratingLabel(spot)
  const facts = factsLine(spot)

  const categories = spot.categories && spot.categories.length > 0 ? spot.categories : (spot.category ? [spot.category] : [])
  const primaryCategory = categories[0]
  const extraCategories = categories.slice(1)
  const showsSecondaryMatch = activeCategory
    && activeCategory !== primaryCategory?.name
    && categories.some(c => c.name === activeCategory)

  return (
    <>
      <div className={`spot-card${isHighlighted ? " highlighted" : ""}`}>
      {/* Misma pestaña, como los títulos de las colecciones. */}
      <Link href={`/spots/${spot.slug}`} className="spot-card-link">
        <div className="spot-card-img-wrap">
          {mainImage ? (
            // Del tamaño en que se muestra (antes se bajaba de hasta 800px
            // para una card de 180px), recortada por Cloudinary donde está
            // lo interesante de la foto.
            <CldImage
              src={mainImage.cloudinary_public_id}
              width={480}
              height={480}
              crop="fill"
              gravity="auto"
              alt={spot.name}
              {...(priority ? { priority: true } : { loading: "lazy" })}
              quality="auto"
              format="auto"
              sizes="(max-width: 480px) 50vw, 300px"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--border)" }} />
          )}
          <div className="spot-card-img-overlay" />
        </div>

        <div className="spot-card-body">
          <p className="spot-card-name" title={spot.name}>{spot.name}</p>
          {/* Departamento · reseñas (antes el departamento era una pill). */}
          <p className={`spot-card-rating${rating.kind === "rating" ? "" : ` is-${rating.kind}`}`}>
            {spot.department && (
              <>
                <span className="spot-card-dept">{spot.department}</span>
                <span className="sep" aria-hidden="true">·</span>
              </>
            )}
            {rating.kind === "rating" && <span className="star">★</span>}
            <span>{rating.text}</span>
          </p>
          {/* La 🐶 va sola; al pasar por encima (y para lectores de pantalla) dice qué es. */}
          {/* Solo si hay algo que decir: vacía ocupaba lugar en blanco. */}
          {facts.length > 0 && (
            <p className="spot-card-facts" title={facts.map(f => (f === PETS_EMOJI ? "Acepta mascotas" : f)).join(" · ")}>
              {facts.join(" · ")}
            </p>
          )}
          {showsSecondaryMatch && (
            <p className="spot-card-secondary-match">
              <span>{CATEGORY_EMOJI[activeCategory] ?? ""}</span>
              <span>Este lugar también ofrece {activeCategory}</span>
            </p>
          )}
          {/* La categoría abajo y el +n en la misma línea: si no entra, se
              achica el texto de la categoría. */}
          <div className="spot-card-badges">
              <Pill variant="beige" style={{ minWidth: 0, overflow: "hidden", flexShrink: 1 }}>
                <span className="spot-card-pill-text">
                  {CATEGORY_EMOJI[primaryCategory?.name] ? `${CATEGORY_EMOJI[primaryCategory.name]} ${primaryCategory.name}` : (primaryCategory?.name || "Sin categoría")}
                </span>
              </Pill>
              {extraCategories.length > 0 && (
                <div
                  style={{ position: "relative", flexShrink: 0 }}
                  onMouseEnter={(e) => {
                    if (!canHover()) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    setExtraCategoriesPos({ left: rect.left, bottom: window.innerHeight - rect.top + 6 })
                    setShowExtraCategories(true)
                  }}
                  onMouseLeave={() => canHover() && setShowExtraCategories(false)}
                  onClick={(e) => {
                    if (canHover()) return
                    e.preventDefault()
                    e.stopPropagation()
                    if (showExtraCategories) {
                      setShowExtraCategories(false)
                      return
                    }
                    const rect = e.currentTarget.getBoundingClientRect()
                    setExtraCategoriesPos({ left: rect.left, bottom: window.innerHeight - rect.top + 6 })
                    setShowExtraCategories(true)
                  }}
                >
                  <Pill variant="beige">+{extraCategories.length}</Pill>
                  {showExtraCategories && extraCategoriesPos && createPortal(
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "fixed", left: extraCategoriesPos.left, bottom: extraCategoriesPos.bottom,
                        background: "#1b1b19", color: "#fff", borderRadius: 10,
                        padding: "8px 10px", fontSize: 12, whiteSpace: "nowrap",
                        display: "flex", flexDirection: "column", gap: 4,
                        zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                      }}
                    >
                      {extraCategories.map(c => (
                        <span key={c.id ?? c.name}>{`${CATEGORY_EMOJI[c.name] ?? ""} ${c.name}`.trim()}</span>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>
              )}
          </div>
        </div>
      </Link>
      {/* Fuera del link: un botón adentro de un link no es HTML válido. */}
      <div className="spot-card-fav">
        <FavoriteButton spot={spot} variant="card" />
      </div>
      </div>
    </>
  )
}

export default SpotCard