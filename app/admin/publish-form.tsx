"use client";

import { useActionState } from "react";
import { publishUberMenu, verifyUberAttempt } from "./publish-actions";
import { useUnsavedChanges } from "./draft-guard";

export function PublishForm({ hash, disabled, current = false }: { hash: string; disabled: boolean; current?: boolean }) {
  const unsaved = useUnsavedChanges();
  disabled ||= unsaved;
  const [state, action, pending] = useActionState(publishUberMenu, { ok: false, message: "" });
  return <form action={action} data-publishing className="mt-6 space-y-4">
    <input type="hidden" name="payloadHash" value={hash} />
    <label className="flex items-start gap-3 text-sm leading-6">
      <input type="checkbox" name="confirmed" required disabled={disabled || pending || current} className="mt-1 h-4 w-4 accent-[#1f5d49]" />
      Replace the Uber test store&apos;s menu with the saved master menu. Unsaved edits are not included.
    </label>
    <button type="submit" disabled={disabled || pending || current} aria-busy={pending} className="rounded-full bg-[#1f5d49] px-6 py-3 text-sm font-semibold text-white hover:bg-[#174637] disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Publishing and verifying…" : unsaved ? "Save edits before publishing" : current ? "Menu is up to date" : "Publish to Uber sandbox"}
    </button>
    <p role="status" aria-live="polite" className={`text-sm leading-6 ${state.ok ? "text-emerald-800" : "text-red-800"}`}>{pending ? "Uploading your saved menu and checking the result with Uber…" : state.message}</p>
  </form>;
}

export function VerifyAttemptForm() {
  const [state, action, pending] = useActionState(verifyUberAttempt, { ok: false, message: "" });
  return <form action={action} data-publishing className="mt-4">
    <button type="submit" disabled={pending} className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{pending ? "Checking Uber…" : "Verify previous attempt"}</button>
    <p role="status" aria-live="polite" className="mt-2 text-sm text-[#52615b]">{state.message}</p>
  </form>;
}
