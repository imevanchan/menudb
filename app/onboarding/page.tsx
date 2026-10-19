import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Onboarding information for the MenuDB menu integration.",
};

const steps = [
  ["Confirm access", "Verify that the restaurant controls the delivery-platform account being connected."],
  ["Authorize the connection", "Approve the platform's requested permissions so MenuDB can exchange menu information."],
  ["Review the master menu", "Check item names, prices, modifiers, and availability before sending updates."],
  ["Test and monitor", "Use the sandbox workflow to verify updates and review any platform response or error."],
];

export default function OnboardingPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Integration setup</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Connect MenuDB</h1>
          <p className="mt-6 text-lg leading-8 text-[#52615b]">MenuDB is currently a sandbox prototype for one restaurant location. This page documents the intended onboarding flow while platform integrations are tested.</p>
        </div>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2">
          {steps.map(([title, description], index) => (
            <li key={title} className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce8dc] text-sm font-semibold text-[#315444]">{index + 1}</span>
              <h2 className="mt-6 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 leading-7 text-[#52615b]">{description}</p>
            </li>
          ))}
        </ol>
        <section className="mt-12 rounded-3xl bg-[#1f5d49] p-8 text-white sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Development status</h2>
          <p className="mt-3 max-w-3xl leading-7 text-white/80">No self-service production onboarding is available yet. The current DoorDash connection is limited to authorized sandbox testing by 1333 Desiree Wok LLC.</p>
          <Link className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1f5d49]" href="/help">View setup help</Link>
        </section>
      </main>
    </SiteShell>
  );
}
