import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session-user";

export const runtime = "nodejs";

function isAllowedImageType(type: string) {
  return (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/svg+xml"
  );
}

function extFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/svg+xml") return "svg";
  return "jpg";
}

export async function POST(req: Request) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file provided" }, { status: 400 });
  }

  if (!isAllowedImageType(file.type)) {
    return NextResponse.json(
      { error: "only jpg, png, webp or svg images are allowed" },
      { status: 400 },
    );
  }

  const uploadsDir = join(process.cwd(), "public", "uploads", "make-logos");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extFromType(file.type);
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filePath = join(uploadsDir, filename);
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/make-logos/${filename}` });
}
