import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { OWN_FOLDER } from "@/lib/social/ownStory";
import { socialDisabled } from "@/lib/ai/http";

// Firma para que el navegador suba fotos/videos DIRECTO a Cloudinary
// (los videos superan el limite de Vercel). El secreto nunca sale del server.
export async function POST() {
  const off = socialDisabled();
  if (off) return off;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: OWN_FOLDER }, process.env.CLOUDINARY_API_SECRET || "");
  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder: OWN_FOLDER,
    signature,
  });
}
