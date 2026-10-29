import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SiteShell } from "../../../components/site-shell";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { ModifierSelector } from "./modifier-selector";

export const instant = false;

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  await connection();
  const { itemId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: item, error } = await supabase
    .from("menu_items")
    .select(`
      id,
      name,
      description,
      price_cents,
      active,
      menu_item_modifier_groups(
        sort_order,
        modifier_groups(
          id,
          name,
          minimum_selections,
          maximum_selections,
          active,
          modifier_options(
            id,
            name,
            price_cents,
            active,
            sort_order
          )
        )
      )
    `)
    .eq("id", itemId)
    .eq("active", true)
    .single();

  if (error || !item) {
    notFound();
  }

  const groups = [...(item.menu_item_modifier_groups ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((assignment) => {
      const relatedGroup = assignment.modifier_groups;
      return Array.isArray(relatedGroup) ? relatedGroup[0] : relatedGroup;
    })
    .filter((group) => group?.active)
    .map((group) => ({
      id: group.id,
      name: group.name,
      minimum_selections: group.minimum_selections,
      maximum_selections: group.maximum_selections,
      options: [...(group.modifier_options ?? [])]
        .filter((option) => option.active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          id: option.id,
          name: option.name,
          price_cents: option.price_cents,
        })),
    }));

  return (
    <SiteShell>
      <main className="mx-auto min-h-[70vh] max-w-2xl px-6 py-16 sm:py-20">
        <Link className="text-sm font-semibold text-[#a3472f] hover:underline" href="/menu">← Back to menu</Link>
        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a3472f]">Customize item</p>
          <div className="mt-4 flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.035em]">{item.name}</h1>
              {item.description && <p className="mt-4 leading-7 text-[#52615b]">{item.description}</p>}
            </div>
            <p className="shrink-0 text-lg font-semibold">${(item.price_cents / 100).toFixed(2)}</p>
          </div>
        </div>

        {groups.length > 0 ? (
          <ModifierSelector basePriceCents={item.price_cents} groups={groups} />
        ) : (
          <div className="mt-10">
            <button className="w-full rounded-full bg-[#a3472f] px-6 py-4 font-semibold text-white" type="button">
              Add to order · ${(item.price_cents / 100).toFixed(2)}
            </button>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
