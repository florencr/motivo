import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session-user";

export const runtime = "nodejs";

function isAllowedImageType(type: string) {
  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/jpg"
  );
}

function extFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isSeller = user.role === "DEALER" || user.role === "PRIVATE_SELLER";
  if (!isSeller) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const formData = await req.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "no files provided" }, { status: 400 });
  }

  const uploadsDir = join(process.cwd(), "public", "uploads", "listings");
  await mkdir(uploadsDir, { recursive: true });

  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (!isAllowedImageType(file.type)) {
      return NextResponse.json(
        { error: "only jpg, png and webp images are allowed" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extFromType(file.type);
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);
    uploadedUrls.push(`/uploads/listings/${filename}`);
  }

  return NextResponse.json({ urls: uploadedUrls });
}
