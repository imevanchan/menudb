import Link from "next/link";
import { SiteShell } from "./components/site-shell";

export default function Home() {
  return (
    <SiteShell>
      <main>
        <section className="mx-auto grid max-w-5xl gap-12 px-6 py-24 md:grid-cols-[1.25fr_.75fr] md:py-32">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">One menu. Every storefront.</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">Keep your delivery menus working from one place.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#52615b]">MenuDB is a menu-management prototype for 1333 Desiree Wok LLC. It is being built to keep items, prices, modifiers, and availability consistent across connected delivery platforms.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="rounded-full bg-[#1f5d49] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#174637]" href="/menu">Explore the menu</Link>
              <Link className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold transition-colors hover:border-black/30" href="/help">Get help</Link>
            </div>
          </div>
          <aside className="self-end rounded-3xl bg-[#dce8dc] p-7">
            <p className="text-sm font-semibold text-[#315444]">Current stage</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">Sandbox prototype complete</p>
            <p className="mt-3 leading-7 text-[#52615b]">An authenticated master-menu editor, a DoorDash menu adapter, and a verified Uber Eats sandbox upload. Publishing history tracks each dashboard attempt.</p>
          </aside>
        </section>
      </main>
    </SiteShell>
  );
}
