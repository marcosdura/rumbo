import { compressImage } from "./compressImage"

export interface PublicIdParams {
  category: string
  spotName: string
  index: number
  spotId: number
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

export function buildPublicId(category: string, spotName: string, index: number): string {
  const formatted = spotName
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("_")
  return `${category}/${formatted}/${formatted}${index + 1}`
}

export async function uploadImageToCloudinary(
  file: File,
  publicIdParams: PublicIdParams
): Promise<CloudinaryUploadResult> {
  const compressedFile = await compressImage(file)
  const publicId = buildPublicId(publicIdParams.category, publicIdParams.spotName, publicIdParams.index)

  const sigRes = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, spotId: publicIdParams.spotId }),
  })
  if (!sigRes.ok) throw new Error("No se pudo obtener la firma de upload")
  const { signature, timestamp, folder, apiKey, cloudName, allowedFormats } = await sigRes.json()

  const formData = new FormData()
  formData.append("file", compressedFile)
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp.toString())
  formData.append("signature", signature)
  formData.append("folder", folder)
  formData.append("public_id", publicId)
  // Tiene que viajar igual que se firmó — Cloudinary recalcula la firma
  // sobre los parámetros que realmente llegan en este POST, así que si
  // falta este campo (o viene distinto), la firma no matchea y rechaza.
  formData.append("allowed_formats", allowedFormats)

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json()
    throw new Error(errorData.error?.message || "Error al subir imagen a Cloudinary")
  }

  const data = await uploadRes.json()
  return { url: data.secure_url, publicId: data.public_id }
}
