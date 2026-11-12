import crypto from "crypto"

// La firma de una subida directa a Cloudinary (solo en el servidor: usa el
// secreto). Lo firmado no se puede cambiar desde el navegador: si un
// parámetro llega distinto, Cloudinary rechaza la subida.
export const ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif,heic,heif"

export function signUpload(folder: string, publicId: string) {
  const timestamp = Math.round(Date.now() / 1000)
  const params: Record<string, string | number> = {
    timestamp,
    folder,
    public_id: publicId,
    allowed_formats: ALLOWED_FORMATS,
    // Sin esto, una firma para un id que ya existe pisaba ese archivo.
    overwrite: "false",
  }
  const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&")
  const signature = crypto.createHash("sha1").update(toSign + process.env.CLOUDINARY_API_SECRET).digest("hex")
  return {
    signature,
    timestamp,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    overwrite: "false",
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  }
}
