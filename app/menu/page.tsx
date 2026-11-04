import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteShell } from "../components/site-shell";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Master Menu",
  description: "The MenuDB master menu.",
};

async function MenuData() {
  await connection();

  let menu;
  let loadError: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("menus")
      .select(`
        id,
        name,
        description,
        active,
        locations!inner(name, merchant_supplied_id),
        categories(
          id,
          name,
          description,
          sort_order,
          active,
          menu_items(
            id,
            name,
            description,
            price_cents,
            active,
            sort_order
          )
        )
      `)
      .eq("locations.merchant_supplied_id", "test-location")
      .eq("active", true)
      .single();

    if (error) {
      loadError = error.message;
    } else {
      menu = data;
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Check the Supabase environment variables.";
  }

  if (!menu) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h2 className="font-semibold">The menu could not be loaded</h2>
        <p className="mt-2 text-sm leading-6">{loadError}</p>
      </div>
    );
  }

  const categories = [...(menu.categories ?? [])]
    .filter((category) => category.active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mt-12 space-y-10">
      <div>
        <p className="text-sm text-[#68756f]">{menu.locations[0]?.name}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">{menu.name}</h2>
        {menu.description && (
          <p className="mt-3 text-[#52615b]">{menu.description}</p>
        )}
      </div>

      {categories.map((category) => {
        const items = [...(category.menu_items ?? [])]
          .filter((item) => item.active)
          .sort((a, b) => a.sort_order - b.sort_order);

        return (
          <section key={category.id}>
            <h3 className="text-xl font-semibold tracking-tight">{category.name}</h3>
            <div className="mt-4 divide-y divide-black/10 rounded-2xl border border-black/10 bg-white px-6 shadow-sm">
              {items.map((item) => (
                <Link className="group flex items-start justify-between gap-6 py-6" href={`/menu/items/${item.id}`} key={item.id}>
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="mt-1 text-sm leading-6 text-[#68756f]">{item.description}</p>
                    <p className="mt-2 text-xs font-semibold text-[#a3472f] opacity-0 transition-opacity group-hover:opacity-100">Customize item →</p>
                  </div>
                  <p className="shrink-0 font-semibold">${(item.price_cents / 100).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function MenuPage() {
  return (
    <SiteShell>
      <main className="mx-auto min-h-[70vh] max-w-4xl px-6 py-20 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Database connection</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Master menu</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52615b]">Explore the saved master menu and customize an item to preview its options. Administrators can edit the menu and publish updates to the Uber Eats sandbox.</p>
        <Suspense fallback={<p className="mt-12 text-[#68756f]">Loading the menu…</p>}>
          <MenuData />
        </Suspense>
      </main>
    </SiteShell>
  );
}
