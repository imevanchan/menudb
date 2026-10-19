import Link from "next/link";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#18201d]">
      <header className="border-b border-black/10 bg-[#f7f5f0]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">MenuDB</Link>
          <nav className="flex gap-5 text-sm text-[#52615b]" aria-label="Main navigation">
            <Link className="transition-colors hover:text-[#18201d]" href="/onboarding">Onboarding</Link>
            <Link className="transition-colors hover:text-[#18201d]" href="/help">Help</Link>
            <Link className="transition-colors hover:text-[#18201d]" href="/privacy">Privacy</Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-[#68756f] sm:flex-row sm:items-center sm:justify-between">
          <p>MenuDB is operated by 1333 Desiree Wok LLC.</p>
          <p>Single-location menu integration prototype.</p>
        </div>
      </footer>
    </div>
  );
}
