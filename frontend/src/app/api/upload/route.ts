import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@clerk/nextjs/server";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension and clean user ID for filename
    let fileExt = "jpg";
    if (file.name && file.name.includes(".")) {
      fileExt = file.name.split(".").pop() || "jpg";
    } else if (file.type) {
      fileExt = file.type.split("/").pop() || "jpg";
    }
    const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");

    const uniqueName = `${cleanUserId}-${Date.now()}.${cleanExt}`;

    try {
      // Attempt to save to public/uploads
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      return NextResponse.json({ imageUrl: `/uploads/${uniqueName}` }, { status: 200 });
    } catch (fsError) {
      console.warn("Disk save failed, falling back to base64 data URL:", fsError);
      const mimeType = file.type || "image/jpeg";
      const base64Data = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json({ imageUrl: dataUrl }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Local Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || "File upload failed" },
      { status: 500 }
    );
  }
}

