import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(file: string, folder: string = "member-os/products") {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [
      { width: 1200, height: 1500, crop: "fill", gravity: "auto" },
      { format: "webp", quality: "auto" },
    ],
  });
  return result.secure_url;
}
