"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

const CATEGORIES = [
  "Account and Profile",
  "Payment and Billing",
  "Technical Support",
  "Communication and Collaboration",
  "Security and Privacy",
  "Hiring and Onboarding",
  "Feedback and Suggestions",
  "Policies and Guidelines",
  "Training and Resources",
  "Affiliates and Partnerships",
  "Request a Feature",
  "Others",
];

const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf",
];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 3;

// Simple in-memory rate limit (per server instance). For stronger limits,
// back this with a table or an edge middleware.
const submissions = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxPerWindow = 3;
  const arr = (submissions.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  submissions.set(key, arr);
  return arr.length > maxPerWindow;
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_JINNI_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_JINNI_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type TicketState = { error?: string };

export async function submitTicket(
  _prev: TicketState,
  formData: FormData
): Promise<TicketState> {
  // Honeypot: bots fill hidden fields. Real users leave it empty.
  if ((formData.get("website") as string)?.trim()) {
    // Pretend success to not tip off the bot.
    redirect("/?ticket=success");
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const audience = (formData.get("audience") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  // Validation
  if (!fullName || !email || !audience || !category || !message) {
    return { error: "Please fill in all required fields." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!["client", "genie"].includes(audience)) {
    return { error: "Please select whether you are a Client or a Genie." };
  }

  // Phone is optional; if provided, it must look like E.164 (+ and 8-15 digits).
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { error: "Please enter a valid phone number, or leave it blank." };
  }
  if (!CATEGORIES.includes(category)) {
    return { error: "Please select a valid category." };
  }
  if (message.length > 5000) {
    return { error: "Message is too long (max 5000 characters)." };
  }

  // Rate limit by email (basic; layered with honeypot)
  if (rateLimited(email.toLowerCase())) {
    return { error: "Too many submissions. Please wait a minute and try again." };
  }

  const supabase = anonClient();

  // Handle attachments (up to 3)
  const files = formData.getAll("attachments").filter(
    (f): f is File => f instanceof File && f.size > 0
  );
  if (files.length > MAX_FILES) {
    return { error: `You can attach at most ${MAX_FILES} files.` };
  }
  const attachmentUrls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: `File type not allowed: ${file.name}. Use images or PDF.` };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { error: `File too large: ${file.name} (max 10MB).` };
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("ticket-attachments")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) {
      return { error: "Attachment upload failed. Please try again." };
    }
    const { data } = supabase.storage.from("ticket-attachments").getPublicUrl(path);
    attachmentUrls.push(data.publicUrl);
  }

  // Insert the ticket
  const { error: insertErr } = await supabase.from("support_tickets").insert({
    audience,
    full_name: fullName,
    email,
    phone,
    category,
    message,
    attachment_urls: attachmentUrls,
    metadata: { source: "help-center" },
  });

  if (insertErr) {
    console.error("[submit-ticket] insert error:", insertErr);
    return { error: "Something went wrong submitting your ticket. Please try again." };
  }

  redirect("/?ticket=success");
}

