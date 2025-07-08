import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn(
    'CLOUDINARY_CLOUD_NAME is not defined. Cloudinary will not be configured.'
  );
}
if (!process.env.CLOUDINARY_API_KEY) {
  console.warn(
    'CLOUDINARY_API_KEY is not defined. Cloudinary will not be configured.'
  );
}
if (!process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    'CLOUDINARY_API_SECRET is not defined. Cloudinary will not be configured.'
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
