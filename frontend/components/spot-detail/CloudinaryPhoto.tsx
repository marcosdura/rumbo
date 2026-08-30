"use client"

import { CldImage } from "next-cloudinary"
import { publicIdFromUrl } from "@/lib/cloudinary"

interface Props {
  src: string
  alt: string
}

// Wrapper para las fotos de kayak/surf, guardadas como secure_url completa
// de Cloudinary (no como cloudinary_public_id, a diferencia de todo el
// resto del sitio). Usa CldImage cuando puede extraer el public_id de la
// URL (auto-format/auto-quality de Cloudinary, mismo patrón que
// ImageGallery.jsx); si no puede, cae a un <img> crudo para no romper la
// página. El contenedor padre necesita position:relative — lo mismo que
// ya exige cualquier uso de CldImage/next-image con `fill`.
export default function CloudinaryPhoto({ src, alt }: Props) {
  const publicId = publicIdFromUrl(src)
  if (!publicId) {
    return (
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    )
  }
  return <CldImage src={publicId} alt={alt} fill className="object-cover" />
}
