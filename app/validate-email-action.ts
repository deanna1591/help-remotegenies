"use server";

import { promises as dns } from "dns";

const SYNTAX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "yopmail.com", "sharklasers.com",
  "getnada.com", "trashmail.com", "maildrop.cc", "dispostable.com",
  "fakeinbox.com", "mailnesia.com", "tempinbox.com", "mytemp.email",
  "spamgourmet.com", "mintemail.com", "tempr.email", "discard.email",
  "emailondeck.com", "mohmal.com", "burnermail.io", "temp-mail.io",
]);

const TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmal.com": "gmail.com",
  "gnail.com": "gmail.com", "gmali.com": "gmail.com", "gmail.co": "gmail.com",
  "gmail.con": "gmail.com", "gmaill.com": "gmail.com", "googlemail.co": "googlemail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com", "outlok.com": "outlook.com", "outloo.com": "outlook.com",
  "outlook.co": "outlook.com", "iclod.com": "icloud.com", "icloud.co": "icloud.com",
};

export type EmailCheck =
  | { ok: true }
  | { ok: false; error: string; suggestion?: string };

export async function validateChatEmail(raw: string): Promise<EmailCheck> {
  const email = (raw || "").trim().toLowerCase();

  if (!SYNTAX.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const domain = email.split("@")[1];

  const typo = TYPO_MAP[domain];
  if (typo) {
    return {
      ok: false,
      error: "Did you mean " + email.split("@")[0] + "@" + typo + "?",
      suggestion: email.split("@")[0] + "@" + typo,
    };
  }

  if (DISPOSABLE.has(domain)) {
    return { ok: false, error: "Please use a permanent email address so we can follow up." };
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (!mx || mx.length === 0) {
      return { ok: false, error: "This email domain can't receive mail. Please check for typos." };
    }
  } catch {
    return { ok: false, error: "We couldn't verify this email domain. Please check for typos." };
  }

  return { ok: true };
}
