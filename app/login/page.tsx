import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "../components/site-shell";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage the MenuDB master menu.",
};

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Private administration</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Sign in to MenuDB</h1>
          <p className="mt-3 text-sm leading-6 text-[#68756f]">Use the administrator account created in Supabase.</p>
          {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>}
          <form action={login} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">Email
              <input className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition focus:border-[#1f5d49] focus:ring-2 focus:ring-[#1f5d49]/15" name="email" type="email" autoComplete="email" required />
            </label>
            <label className="block text-sm font-medium">Password
              <input className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition focus:border-[#1f5d49] focus:ring-2 focus:ring-[#1f5d49]/15" name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="w-full rounded-full bg-[#1f5d49] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#174637]" type="submit">Sign in</button>
          </form>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <SiteShell>
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-20">
        <Suspense fallback={<p className="text-[#68756f]">Loading sign in…</p>}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </main>
    </SiteShell>
  );
}
