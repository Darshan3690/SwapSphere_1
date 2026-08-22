import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
    } catch (authError) {
      console.warn("Upload Auth Warning:", authError);
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to upload images." }, { status: 401 });
    }

    const data = await request.formData();
    const file = data.get("file") as File | null;

    if (!file || typeof file === "string" || !file.size) {
      return NextResponse.json({ error: "No valid image file provided" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 413 });
    }

    const safeExtension = ALLOWED_IMAGE_TYPES[file.type];
    if (!safeExtension) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using a Promise
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "swapsphere_uploads" }, // Optional: organizes your images in a folder
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // End the stream with the buffer
      uploadStream.end(buffer);
    }) as any;

    // Return the secure URL from Cloudinary
    return NextResponse.json({ imageUrl: uploadResult.secure_url }, { status: 200 });

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || "File upload failed" },
      { status: 500 }
    );
  }
}

