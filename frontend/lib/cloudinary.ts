// Las fotos de kayak/surf se guardan como secure_url completa de Cloudinary
// (no como cloudinary_public_id, a diferencia de todo el resto del sitio)
// — esta función extrae el public_id de esa URL para poder usar CldImage
// igual que en todos lados, en vez de un <img> crudo sin auto-format/
// auto-quality de Cloudinary.
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/)
  return match ? match[1] : null
}
