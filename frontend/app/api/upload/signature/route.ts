import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { api, ApiError } from "@/lib/api";
import { signUpload } from "@/lib/cloudinarySignature";

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
  try {
    await api.get(`/spots/${spotId}/can-upload`, {
      token: session.id_token,
      params: { public_id: publicId },
    });
  } catch (e) {
    // El tope de subidas por usuario (backend/uploads.py): se dice tal cual.
    if (e instanceof ApiError && e.status === 429) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }
    return NextResponse.json({ error: "No autorizado para subir a este spot" }, { status: 403 });
  }

  return NextResponse.json(signUpload("rumbo/spots", publicId));
}
