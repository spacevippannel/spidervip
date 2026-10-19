import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("apkFile");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "No APK file uploaded" }, { status: 400 });
    }

    const rawName = file.name || "SpaceVIP_Update.apk";
    const cleanName = rawName.replace(/[^a-zA-Z0-9_\.-]/g, "_");

    if (!cleanName.toLowerCase().endsWith(".apk")) {
      return NextResponse.json({ success: false, message: "Only .apk files are supported" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const updatesDir = path.join(process.cwd(), "public", "updates");
    await fs.mkdir(updatesDir, { recursive: true });

    const filePath = path.join(updatesDir, cleanName);
    await fs.writeFile(filePath, buffer);

    const sizeInMB = (buffer.length / (1024 * 1024)).toFixed(2) + " MB";

    return NextResponse.json({
      success: true,
      url: `/updates/${cleanName}`,
      fileName: cleanName,
      fileSize: sizeInMB,
      uploadedAt: Date.now()
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || "Failed to upload APK file" }, { status: 500 });
  }
}
