import { CldImage } from 'next-cloudinary';

export default function SpotImage({ publicId, alt }) {
  return (
    <CldImage
      src={publicId}
      width={800}
      height={600}
      alt={alt || "Foto del spot"}
      crop="fill"
      gravity="auto"
    />
  );
}