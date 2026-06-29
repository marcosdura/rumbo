import { compressImage } from "./compressImage"

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const compressedFile = await compressImage(file)

  const sigRes = await fetch("/api/upload/signature", { method: "POST" })
  if (!sigRes.ok) throw new Error("No se pudo obtener la firma de upload")
  const { signature, timestamp, folder, apiKey, cloudName } = await sigRes.json()

  const formData = new FormData()
  formData.append("file", compressedFile)
  formData.append("api_key", apiKey)
  formData.append("timestamp", timestamp.toString())
  formData.append("signature", signature)
  formData.append("folder", folder)

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
