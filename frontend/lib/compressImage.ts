import imageCompression from "browser-image-compression"

export async function compressImage(file: File): Promise<File> {
  // Si ya es chica, no hace falta comprimir
  if (file.size <= 1.5 * 1024 * 1024) return file

  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  }

  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error("Error comprimiendo imagen, se sube el archivo original:", error)
    return file
  }
}
