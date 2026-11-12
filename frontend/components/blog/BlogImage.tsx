"use client"

// Una foto del blog (cloudinary_public_id), recortada por Cloudinary al
// tamaño en que se muestra, como las de las cards.
import { CldImage } from "next-cloudinary"

type Props = {
  id: string
  alt: string
  width: number
  height: number
  sizes: string
  priority?: boolean
  className?: string
}

export default function BlogImage({ id, alt, width, height, sizes, priority = false, className }: Props) {
  return (
    <CldImage
      src={id}
      width={width}
      height={height}
      crop="fill"
      gravity="auto"
      alt={alt}
      quality="auto"
      format="auto"
      sizes={sizes}
      className={className}
      {...(priority ? { priority: true } : { loading: "lazy" as const })}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  )
}

export const cloudinaryUrl = (id: string) =>
  `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${id}`
