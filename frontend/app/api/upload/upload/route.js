// app/api/upload/route.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const publicId = formData.get('public_id');
  const spotId = formData.get('spotId');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadOptions = publicId
    ? { public_id: publicId, overwrite: true }
    : { folder: `spots/${spotId}`, public_id: `spot_${spotId}_main` }

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  return Response.json({ public_id: result.public_id, url: result.secure_url });
}