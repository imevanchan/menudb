"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

function FormFields({ dirty, children }: { dirty: boolean; children: ReactNode }) {
  const { pending } = useFormStatus();
  return <>
    <p role="status" aria-live="polite" className={`mb-4 text-xs font-medium ${pending ? "text-[#1f5d49]" : dirty ? "text-amber-900" : "text-[#68756f]"}`}>
      {pending ? "Saving your changes…" : dirty ? "Unsaved changes — save before publishing." : "Saved values"}
    </p>
    <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-70">{children}</fieldset>
  </>;
}

export function EditorForm({ action, children, className, label }: {
  action: (formData: FormData) => Promise<void>; children: ReactNode; className?: string; label: string;
}) {
  const [dirty, setDirty] = useState(false);
  return <form action={action} className={className} aria-label={label} onChange={(event) => {
    const changed = Array.from(event.currentTarget.elements).some((element) => {
      if (element instanceof HTMLInputElement) return element.type === "checkbox" || element.type === "radio" ? element.checked !== element.defaultChecked : element.value !== element.defaultValue;
      if (element instanceof HTMLTextAreaElement) return element.value !== element.defaultValue;
      if (element instanceof HTMLSelectElement) return Array.from(element.options).some((option) => option.selected !== option.defaultSelected);
      return false;
    });
    setDirty(changed);
  }}>
    <FormFields dirty={dirty}>{children}</FormFields>
  </form>;
}
