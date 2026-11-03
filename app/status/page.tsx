import type { Metadata } from "next";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Integration status",
  description: "Sandbox and preproduction integration status for MenuDB.",
};

const platforms = [
  { name: "DoorDash", environment: "Marketplace sandbox", status: "Adapter ready", tone: "border-emerald-200 bg-emerald-50 text-emerald-900", details: "The master menu is transformed into an authenticated DoorDash Menu Pull response. Live transmission is blocked pending Marketplace activation and a test store." },
  { name: "Uber Eats", environment: "Sandbox", status: "Upload verified", tone: "border-emerald-200 bg-emerald-50 text-emerald-900", details: "The master menu is converted into Uber format, validated, and uploaded to the sandbox. Retrieval confirmed matching items, prices, modifiers, categories, and hours. Live production access is not enabled." },
  { name: "Grubhub", environment: "Public preproduction", status: "Environment available", tone: "border-amber-200 bg-amber-50 text-amber-950", details: "The preproduction API can support a future adapter. Supabase remains the platform-neutral source of truth." },
];

export default function StatusPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Sandbox scope</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Integration status</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#52615b]">MenuDB demonstrates a production-style master-menu architecture using only the environments and permissions currently available. It does not claim live production access to any delivery marketplace.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {platforms.map((platform) => (
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm" key={platform.name}>
              <p className="text-sm text-[#68756f]">{platform.environment}</p>
              <h2 className="mt-2 text-2xl font-semibold">{platform.name}</h2>
              <p className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${platform.tone}`}>{platform.status}</p>
              <p className="mt-5 text-sm leading-6 text-[#52615b]">{platform.details}</p>
            </section>
          ))}
        </div>
        <section className="mt-10 rounded-3xl bg-[#dce8dc] p-7 sm:p-9">
          <h2 className="text-2xl font-semibold">Demonstrated data flow</h2>
          <p className="mt-4 font-mono text-sm leading-7 text-[#315444]">Admin editor → Supabase master menu → Platform adapter → Authenticated sandbox endpoint</p>
          <p className="mt-4 max-w-3xl leading-7 text-[#52615b]">Platform transmission is intentionally separate from transformation. A real transport can be enabled later without redesigning the editor or database.</p>
        </section>
      </main>
    </SiteShell>
  );
}
