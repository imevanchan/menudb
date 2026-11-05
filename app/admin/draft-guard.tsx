"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const DraftContext = createContext(false);
export const useUnsavedChanges = () => useContext(DraftContext);

// Compare against rendered defaults, so restoring a field clears the warning.
function dirty(form: HTMLFormElement) {
  return Array.from(form.elements).some((element) => {
    if (element instanceof HTMLInputElement) {
      if (["hidden", "submit", "button"].includes(element.type)) return false;
      return ["checkbox", "radio"].includes(element.type) ? element.checked !== element.defaultChecked : element.value !== element.defaultValue;
    }
    if (element instanceof HTMLTextAreaElement) return element.value !== element.defaultValue;
    if (element instanceof HTMLSelectElement) {
      const defaults = Array.from(element.options).filter((option) => option.defaultSelected).map((option) => option.value);
      const expected = defaults.length ? defaults : element.options.length ? [element.options[0].value] : [];
      return JSON.stringify(Array.from(element.selectedOptions, (option) => option.value)) !== JSON.stringify(expected);
    }
    return false;
  });
}

export function DraftGuard({ children }: { children: ReactNode }) {
  const [unsaved, setUnsaved] = useState(false);
  useEffect(() => {
    const forms = () => Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter((form) => !form.closest("[data-publishing]"));
    const changed = () => setUnsaved(forms().some(dirty));
    const leave = (event: BeforeUnloadEvent) => {
      if (forms().some(dirty)) { event.preventDefault(); event.returnValue = ""; }
    };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link && forms().some(dirty) && !window.confirm("You have unsaved menu edits. Leave without saving them?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const publishing = Boolean(form.closest("[data-publishing]"));
      const otherDrafts = forms().some((other) => (publishing || other !== form) && dirty(other));
      if (otherDrafts && (publishing || !window.confirm("Saving this form may discard unsaved edits in other forms. Continue?"))) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    const observer = new MutationObserver(changed);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", changed);
    document.addEventListener("change", changed);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    window.addEventListener("beforeunload", leave);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", changed);
      document.removeEventListener("change", changed);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      window.removeEventListener("beforeunload", leave);
    };
  }, []);
  return <DraftContext.Provider value={unsaved}>{unsaved && <p role="status" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">You have unsaved edits. Save or restore them before publishing.</p>}{children}</DraftContext.Provider>;
}
