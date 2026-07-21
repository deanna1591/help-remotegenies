"use server";

import { createClient } from "@supabase/supabase-js";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = /\.(png|jpe?g|gif|webp|pdf|docx?|xlsx?|csv|txt|zip)$/i;

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadChatFile(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file selected." };
  if (file.size > MAX_SIZE) return { ok: false, error: "File too large (max 10 MB)." };
  if (!ALLOWED.test(file.name)) return { ok: false, error: "File type not supported." };

  const url = process.env.NEXT_PUBLIC_JINNI_SUPABASE_URL;
  const key = process.env.JINNI_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: "Upload not configured." };

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = "chat-widget/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + safeName;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("ticket-attachments")
    .upload(path, buf, { contentType: file.type || "application/octet-stream" });
  if (error) {
    console.error("[chat-upload] failed", error);
    return { ok: false, error: "Upload failed. Please try again." };
  }

  const { data: pub } = supabase.storage.from("ticket-attachments").getPublicUrl(path);
  if (!pub?.publicUrl) return { ok: false, error: "Could not get file URL." };

  return { ok: true, url: pub.publicUrl };
}
