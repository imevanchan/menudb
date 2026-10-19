import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteShell } from "../components/site-shell";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { logout } from "../login/actions";

export const metadata: Metadata = {
  title: "Menu administration",
  description: "Private MenuDB administration dashboard.",
};

// Authentication depends on request cookies and token-expiration time.
export const instant = false;

async function AdminContent() {
  await connection();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const email = String(data.claims.email ?? "Administrator");

  return (
    <>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Authenticated</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Menu administration</h1>
            <p className="mt-4 text-[#52615b]">Signed in as {email}</p>
          </div>
          <form action={logout}>
            <button className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold hover:border-black/30" type="submit">Sign out</button>
          </form>
        </div>
        <section className="mt-12 rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Authentication is working</h2>
          <p className="mt-3 max-w-2xl leading-7 text-[#52615b]">This page is protected. The next step will add authenticated editing controls and narrowly scoped database write policies.</p>
        </section>
    </>
  );
}

export default function AdminPage() {
  return (
    <SiteShell>
      <main className="mx-auto min-h-[70vh] max-w-5xl px-6 py-20 sm:py-24">
        <Suspense fallback={<p className="text-[#68756f]">Loading administration…</p>}>
          <AdminContent />
        </Suspense>
      </main>
    </SiteShell>
  );
}
