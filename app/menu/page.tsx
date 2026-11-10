import type { Metadata } from "next";
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
            sort_order,
            menu_item_modifier_groups(
              sort_order,
              modifier_groups(
                id, name, minimum_selections, maximum_selections, active,
                modifier_options(id, name, price_cents, active, sort_order)
              )
            )
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
                <article className="py-6" id={`item-${item.id}`} key={item.id}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h4 className="font-semibold">{item.name}</h4>
                      {item.description && <p className="mt-1 text-sm leading-6 text-[#68756f]">{item.description}</p>}
                    </div>
                    <p className="shrink-0 font-semibold">${(item.price_cents / 100).toFixed(2)}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[...(item.menu_item_modifier_groups ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((assignment) => {
                      const related = assignment.modifier_groups;
                      const group = Array.isArray(related) ? related[0] : related;
                      if (!group?.active) return null;
                      const options = [...(group.modifier_options ?? [])].filter((option) => option.active).sort((a, b) => a.sort_order - b.sort_order);
                      if (!options.length) return null;
                      return <details key={group.id} className="rounded-xl border border-black/10 bg-[#faf9f6]">
                        <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3472f]">
                          {group.name}<span className="ml-2 text-xs font-normal text-[#68756f]">{group.minimum_selections > 0 ? "Required" : "Optional"} · {group.minimum_selections === group.maximum_selections ? `Choose ${group.maximum_selections}` : `Choose ${group.minimum_selections}–${group.maximum_selections}`}</span>
                        </summary>
                        <ul className="divide-y divide-black/5 border-t border-black/10 px-4">{options.map((option) => <li key={option.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                          <span>{option.name}</span><span className="shrink-0 text-[#68756f]">{option.price_cents === 0 ? "Included" : `${option.price_cents > 0 ? "+" : "−"}$${(Math.abs(option.price_cents) / 100).toFixed(2)}`}</span>
                        </li>)}</ul>
                      </details>;
                    })}
                  </div>
                </article>
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
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52615b]">Explore the saved master menu. Expand a modifier group beneath an item to view its options and prices.</p>
        <Suspense fallback={<p className="mt-12 text-[#68756f]">Loading the menu…</p>}>
          <MenuData />
        </Suspense>
      </main>
    </SiteShell>
  );
}
