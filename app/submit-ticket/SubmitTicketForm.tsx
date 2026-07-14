"use client";

import { useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { submitTicket, type TicketState } from "./actions";

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

const initial: TicketState = {};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-gradient-primary text-white font-semibold px-6 py-3.5 rounded-2xl hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Submitting..." : "Submit ticket"}
    </button>
  );
}

export default function SubmitTicketForm() {
  const [state, formAction] = useFormState(submitTicket, initial);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const phoneValid = !phone || isValidPhoneNumber(phone);

  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const showPhoneError = phoneTouched && !!phone && !phoneValid;

  const blockSubmit = (email.length > 0 && !emailValid) || (!!phone && !phoneValid);

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    const combined = [...files, ...picked].slice(0, 3);
    setFiles(combined);
    const dt = new DataTransfer();
    combined.forEach((f) => dt.items.add(f));
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }

  function removeFile(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  }

  const labelCls = "block text-sm font-semibold text-ink mb-1.5";
  const inputCls =
    "w-full bg-white border border-gray-200 focus:border-primary/50 rounded-xl px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink-faint";
  const errCls = "text-xs text-red-600 mt-1";

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      <div>
        <label className={labelCls}>Contact Name <span className="text-red-500">*</span></label>
        <input name="full_name" required className={inputCls} placeholder="Your name" />
      </div>

      <div>
        <label className={labelCls}>Email <span className="text-red-500">*</span></label>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          className={inputCls + (showEmailError ? " border-red-400 focus:border-red-500" : "")}
          placeholder="you@example.com"
        />
        {showEmailError && <p className={errCls}>Please enter a valid email address.</p>}
      </div>

      <div>
        <label className={labelCls}>Phone Number</label>
        <input type="hidden" name="phone" value={phone || ""} />
        <div className={"rgphone " + (showPhoneError ? "rgphone-error" : "")}>
          <PhoneInput
            international
            value={phone}
            onChange={setPhone}
            onBlur={() => setPhoneTouched(true)}
            placeholder="Optional"
          />
        </div>
        {showPhoneError && <p className={errCls}>Please enter a valid phone number, or leave it blank.</p>}
      </div>

      <div>
        <label className={labelCls}>Are you a Client or a Genie? <span className="text-red-500">*</span></label>
        <select name="audience" required defaultValue="" className={inputCls}>
          <option value="" disabled>Select option...</option>
          <option value="client">Client</option>
          <option value="genie">Genie</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>What can we help you with? <span className="text-red-500">*</span></label>
        <select name="category" required defaultValue="" className={inputCls}>
          <option value="" disabled>Select option...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Message <span className="text-red-500">*</span></label>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={5000}
          className={inputCls + " resize-y"}
          placeholder="Tell us what's going on — the more detail, the faster we can help."
        />
      </div>

      <div>
        <label className={labelCls}>Attach a file</label>
        <p className="text-xs text-ink-muted mb-2">Up to 3 files — images or PDF, max 10MB each.</p>
        <input
          ref={fileInputRef}
          name="attachments"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          onChange={onFilesPicked}
          className="block w-full text-sm text-ink-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-soft file:text-primary-hover file:font-medium hover:file:bg-primary/10 transition"
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 ml-2 shrink-0">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SubmitButton disabled={blockSubmit} />
    </form>
  );
}
