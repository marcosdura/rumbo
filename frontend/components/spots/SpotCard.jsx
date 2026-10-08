"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import FavoriteButton from "@/components/spot-detail/FavoriteButton"
import CircleArrow from "@/components/ui/CircleArrow"
import Pill from "@/components/ui/Pill"
import { CldImage } from 'next-cloudinary'
import { factsLine, ratingLabel } from "@/lib/spotCard"

const CATEGORY_EMOJI = {
  Camping: "🏕️", Glamping: "🛖", Trekking: "🥾",
  Escalada: "🧗", Surf: "🏄", Kayak: "🛶", Motorhome: "🚐",
}

function SpotCard({ spot, isHighlighted = false, activeCategory }) {
  const [hovered, setHovered] = useState(false)
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
      <style>{`

        .spot-card {
          font-family: var(--font-dm-sans), sans-serif;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          will-change: transform, box-shadow;
        }
        .spot-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .spot-card.highlighted {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .spot-card-img-wrap {
          height: 160px;
          overflow: hidden;
          position: relative;
        }
        .spot-card-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .spot-card:hover .spot-card-img-wrap img {
          transform: scale(1.07);
        }

        .spot-card-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 55%);
        }

        .spot-card-body { padding: 10px 12px 12px; }

        .spot-card-name {
          font-family: var(--font-playfair-display), serif;
          font-size: 15px;
          font-weight: 600;
          color: #1b1b19;
          margin: 0 0 3px;
        }

        .spot-card-rating {
          font-size: 13px;
          color: var(--muted-strong);
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .spot-card-rating .star { color: var(--primary); }
        .spot-card-rating.is-new { color: var(--primary); font-weight: 600; }
        .spot-card-rating.is-none { color: var(--muted); }

        .spot-card-facts {
          font-size: 12px;
          color: var(--muted-strong);
          margin: 0 0 8px;
          min-height: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spot-card { position: relative; }
        .spot-card-link { text-decoration: none; display: block; color: inherit; }
        .spot-card-fav { position: absolute; top: 10px; right: 10px; z-index: 10; }

        .spot-card-secondary-match {
          font-size: 11px;
          font-weight: 500;
          color: var(--primary);
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .spot-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .spot-card-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          min-width: 0;
        }

        .dept-pill {
          min-width: 0;
          overflow: hidden;
          flex-shrink: 1;
        }
        .dept-pill-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }

        @media (max-width: 480px) {
          .spot-card-img-wrap { height: 120px; }
          .spot-card-name     { font-size: 13px; }
          .spot-card-body     { padding: 8px 10px 10px; }
          .spot-card-badges   {
            flex-wrap: wrap;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            overflow: hidden;
          }
        }
      `}</style>

      <div
        className={`spot-card${isHighlighted ? " highlighted" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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
              loading="lazy"
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
          <p className="spot-card-name">{spot.name}</p>
          <p className={`spot-card-rating${rating.kind === "rating" ? "" : ` is-${rating.kind}`}`}>
            {rating.kind === "rating" && <span className="star">★</span>}
            <span>{rating.text}</span>
          </p>
          <p className="spot-card-facts" title={facts.join(" · ") || undefined}>
            {facts.join(" · ")}
          </p>
          {showsSecondaryMatch && (
            <p className="spot-card-secondary-match">
              <span>{CATEGORY_EMOJI[activeCategory] ?? ""}</span>
              <span>Este lugar también ofrece {activeCategory}</span>
            </p>
          )}
          <div className="spot-card-footer">
            <div className="spot-card-badges">
              <Pill variant="beige">
                {CATEGORY_EMOJI[primaryCategory?.name] ? `${CATEGORY_EMOJI[primaryCategory.name]} ${primaryCategory.name}` : (primaryCategory?.name || "Sin categoría")}
              </Pill>
              {extraCategories.length > 0 && (
                <div
                  style={{ position: "relative" }}
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
              <Pill variant="dark-green" style={{ minWidth: 0, overflow: "hidden", flexShrink: 1 }}>
                <span className="dept-pill-text">{spot.department || "Sin departamento"}</span>
              </Pill>
            </div>
            <CircleArrow active={hovered} />
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