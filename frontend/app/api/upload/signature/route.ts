import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.id_token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { publicId, spotId } = await req.json();
  if (!publicId || !spotId) {
    return NextResponse.json({ error: "Falta publicId o spotId" }, { status: 400 });
  }

  // El spot tiene que ser del usuario (o admin), y ese public_id no puede
  // estar ya en uso por otro spot — sin esto, cualquiera logueado podía
  // pedir una firma válida para pisar la foto de un spot ajeno.
  const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/spots/${spotId}/can-upload?public_id=${encodeURIComponent(publicId)}`;
  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${session.id_token}` },
  });
  if (!checkRes.ok) {
    return NextResponse.json({ error: "No autorizado para subir a este spot" }, { status: 403 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "rumbo/spots";
  // Firmado, no solo un hint del navegador: si alguien pide subir otra cosa
  // (o edita el multipart a mano), Cloudinary rechaza el upload aunque el
  // request tenga una firma "válida" — cambiar este parámetro invalida la
  // firma entera, así que no es bypasseable editando el JS del cliente.
  const allowedFormats = "jpg,jpeg,png,webp,gif,heic,heif";

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
    public_id: publicId,
    allowed_formats: allowedFormats,
  };

  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(sortedParams + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    allowedFormats,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}
