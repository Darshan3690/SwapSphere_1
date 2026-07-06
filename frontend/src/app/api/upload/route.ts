import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create the public/uploads folder if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Clean up filename and append a timestamp to make it unique
    const fileExt = file.name.split(".").pop();
    const uniqueName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = join(uploadDir, uniqueName);

    // Save to disk
    await writeFile(filePath, buffer);

    return NextResponse.json({ imageUrl: `/uploads/${uniqueName}` }, { status: 200 });
  } catch (error: any) {
    console.error("Local Upload Error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
