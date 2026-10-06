import { compressImage } from "./compressImage"

export interface PublicIdParams {
  spotId: number
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
}

// Antes era `Categoria/Nombre/NombreN`, con N = cantidad de fotos + 1: un id
// predecible y que se repetía (borrar la foto 1 de 3 y subir otra generaba
// otra vez Nombre3, pisando la tercera). Ahora es el id del spot + 16 hex
// aleatorios — no depende del nombre (que puede cambiar) ni de cuántas fotos
// hay. El backend (`can-upload`) exige exactamente este formato.
export function buildPublicId(spotId: number): string {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
  return `${spotId}/${random}`
}

export async function uploadImageToCloudinary(
  file: File,
  publicIdParams: PublicIdParams
): Promise<CloudinaryUploadResult> {
  const compressedFile = await compressImage(file)
  const publicId = buildPublicId(publicIdParams.spotId)

  const sigRes = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, spotId: publicIdParams.spotId }),
  })
  if (!sigRes.ok) throw new Error("No se pudo obtener la firma de upload")
  const { signature, timestamp, folder, apiKey, cloudName, allowedFormats, overwrite } = await sigRes.json()

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
  formData.append("overwrite", overwrite)

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
  // Con overwrite=false, si el public_id ya existe Cloudinary no da error:
  // devuelve 200 con el archivo VIEJO y `existing: true`. Tomarlo como éxito
  // sería asociar al spot una foto que no es la que se subió.
  if (data.existing) {
    throw new Error("Ya existe una imagen con ese identificador")
  }
  return { url: data.secure_url, publicId: data.public_id }
}
